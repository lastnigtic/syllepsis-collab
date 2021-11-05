import axios from 'axios';
import { Step } from 'prosemirror-transform';
import { getSchemaJSON } from './utils';
import { receiveTransaction, sendableSteps, getVersion } from 'prosemirror-collab';
import 'prosemirror-view/style/prosemirror.css';
import { EventChannel, SylApi } from '@syllepsis/adapter';
import { EditorState, Transaction } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { collab } from 'prosemirror-collab';
import { Reporter } from './reporter';

const badVersion = (err) => {
  return err.status == 400 && /invalid version/i.test(err);
};
const collabPlugin = collab();

const repeat = (val, n) => {
  let result = [];
  for (let i = 0; i < n; i++) result.push(val);
  return result;
};

const getReqData = async (request) => {
  try {
    const { data } = await request;
    if (!data.code) return data.data;
    throw data;
  } catch (err) {
    throw err;
  }
};

type TActionType = 'start' | 'poll' | 'loaded' | 'restart' | 'recover' | 'transaction' | 'detached' | 'send';

class State {
  public edit: null | EditorState = null;
  public comm: TActionType;

  constructor(edit, comm: TActionType) {
    this.edit = edit;
    this.comm = comm;
  }
}

class EditorConnection {
  report: Reporter;
  url: string;
  id: string;
  sylEditor: SylApi;
  schemaSpec: { nodes: {}; marks: {} };
  state: State;
  request: any;
  backOff: number;
  view: any;

  constructor(report, url, id, sylEditor) {
    this.report = report;
    this.url = url;
    this.id = id;
    this.sylEditor = sylEditor;
    this.schemaSpec = getSchemaJSON(sylEditor.view.state.schema);
    this.state = new State(null, 'start');
    this.request = null;
    this.backOff = 0;
    this.view = null;
    this.dispatch = this.dispatch.bind(this);
    this.start();
  }

  async start() {
    try {
      const { doc, version } = await this.post(this.url, {
        schema: this.schemaSpec,
      });
      this.report.success();
      this.backOff = 0;
      this.dispatch({
        type: 'loaded',
        doc,
        version,
      });
    } catch (err) {
      this.report.failure(err);
    }
  }

  async dispatch(action: {
    type: TActionType;
    error?: { status: number };
    doc?: ProseMirrorNode;
    version?: number;
    transaction?: Transaction;
    requestDone?: boolean;
  }) {
    let newEditState = null;
    switch (action.type) {
      case 'loaded': {
        this.sylEditor.setContent({ doc: action.doc, selection: { anchor: 1, head: 1, type: 'text' } });
        this.sylEditor.view.dispatch(
          this.sylEditor.view.state.tr.setMeta(collabPlugin, { version: action.version, unconfirmed: [] })
        );
        this.state = new State(this.sylEditor.view.state, 'poll');
        this.poll();
        break;
      }
      case 'restart': {
        this.state = new State(null, 'start');
        this.start();
        break;
      }
      case 'poll': {
        this.state = new State(this.state.edit, 'poll');
        this.poll();
        break;
      }
      case 'recover': {
        if (action.error.status && action.error.status < 500) {
          this.report.failure(action.error);
          this.state = new State(null, null);
        } else {
          this.state = new State(this.state.edit, 'recover');
        }
        break;
      }
      case 'transaction': {
        newEditState = this.state.edit.apply(action.transaction);
        break;
      }
    }

    if (newEditState) {
      let steps: { steps: Record<string, any> };
      if (newEditState.doc.content.size > 40000) {
        if (this.state.comm !== 'detached') this.report.failure('文章内容过长！');
        this.state = new State(newEditState, 'detached');
      } else if ((this.state.comm === 'poll' || action.requestDone) && (steps = this.sendable(newEditState))) {
        this.closeRequest();
        this.state = new State(newEditState, 'send');
        this.send(newEditState, steps);
      } else if (action.requestDone) {
        this.state = new State(newEditState, 'poll');
        this.poll();
      } else {
        this.state = new State(newEditState, this.state.comm);
      }
    }

    if (this.state.edit) {
      if (this.view) {
        this.view.updateState(this.state.edit);
        this.sylEditor.emit(EventChannel.LocalEvent.ON_CHANGE);
      } else {
        this.view = this.sylEditor.view;
        this.view.setProps({
          dispatchTransaction: (transaction) => this.dispatch({ type: 'transaction', transaction }),
        });
      }
    } else {
      this.setView(null);
    }
  }

  async send(editState, { steps }) {
    let json = JSON.stringify({
      version: getVersion(editState),
      steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
      clientIDs: steps ? steps.clientIDs : 0,
    });

    try {
      await this.post(`${this.url}/events`, json);

      this.report.success();
      this.backOff = 0;

      const tr = steps
        ? receiveTransaction(this.state.edit, steps.steps, repeat(steps.clientID, steps.steps.length))
        : this.state.edit.tr;
      this.dispatch({
        type: 'transaction',
        transaction: tr,
        requestDone: true,
      });
    } catch (err) {
      if (err instanceof axios.Cancel) return;
      // 冲突
      if (err.status == 409) {
        this.backOff = 0;
        this.dispatch({ type: 'poll' });
      } else if (badVersion(err)) {
        this.report.failure(err);
        this.dispatch({ type: 'restart' });
      } else {
        this.dispatch({ type: 'recover', error: err });
      }
    }
  }

  async poll() {
    try {
      let query = `version=${getVersion(this.state.edit)}`;
      const data = await this.get(`${this.url}/events?${query}`);
      this.backOff = 0;
      if (data.steps && data.steps.length) {
        const tr = receiveTransaction(
          this.state.edit,
          data.steps.map((j) => Step.fromJSON(this.sylEditor.view.state.schema, j)),
          data.clientIDs
        );
        this.dispatch({
          type: 'transaction',
          transaction: tr,
          requestDone: true,
        });

        // 显示用户数量
        document.querySelector('#user-count').textContent = `(${data.users}user${data.users > 1 ? 's' : ''})`;
      } else {
        this.poll();
      }
      // 用户数目
    } catch (err) {
      if (err instanceof axios.Cancel) return;
      if (err.status === 410 || badVersion(err)) {
        this.report.failure(err);
        this.dispatch({ type: 'restart' });
      } else if (err) {
        this.dispatch({ type: 'recover', error: err });
      }
    }
  }

  recover(err) {
    let newBackOff = this.backOff ? Math.min(this.backOff * 2, 6e4) : 200;
    if (newBackOff > 1000 && this.backOff < 1000) this.report.delay(err);
    this.backOff = newBackOff;
    setTimeout(() => {
      if (this.state.comm === 'recover') this.dispatch({ type: 'poll' });
    }, this.backOff);
  }

  sendable(editState) {
    // prosemirror-collab
    let steps = sendableSteps(editState);
    if (steps) return { steps };
  }

  closeRequest() {
    if (this.request) {
      this.abortReq();
      this.request = null;
    }
  }
  abortReq() {
    throw new Error('Method not implemented.');
  }

  get(url) {
    return (this.request = getReqData(
      axios.get(url, {
        headers: {
          editor_id: this.id,
        },
        cancelToken: new axios.CancelToken((abortReq) => {
          this.abortReq = abortReq;
        }),
      })
    ));
  }

  post(url, data) {
    return (this.request = getReqData(
      axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          editor_id: this.id,
        },
        cancelToken: new axios.CancelToken((abortReq) => {
          this.abortReq = abortReq;
        }),
      })
    ));
  }

  close() {
    this.closeRequest();
    this.setView(null);
  }

  setView(view) {
    if (this.view) this.view.destroy();
    this.view = window.view = view;
  }
}
export { EditorConnection, collabPlugin };

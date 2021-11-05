import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { RichEditor } from './syllepsis';
import { Reporter } from './reporter';
import { EditorConnection, collabPlugin } from './collab';

const report = new Reporter();

const getId = () => {
  let id = localStorage.getItem('PR_ID');
  if (!id) {
    id = Date.now().toString().substr(6);
    localStorage.setItem('PR_ID', id);
  }
  return id;
};

let info = {
  doc: 'test',
  id: getId(),
};

const App = () => {
  const [connection, setConnection] = useState(null);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    if (!editor) return;

    if (connection) connection.close();
    // @ts-ignore
    const newConnection = (window.connection = new EditorConnection(
      report,
      '/collab-backend/docs/' + info.doc,
      info.id,
      editor
    ));

    newConnection.request.then(() => editor.focus());

    setConnection(newConnection);
  }, [editor]);

  return <RichEditor extraPlugins={[collabPlugin]} getEditor={(e) => setEditor(e)} />;
};

ReactDOM.render(<App />, document.querySelector('#editor'));

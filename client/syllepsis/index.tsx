import {
  BackgroundPlugin,
  ColorPlugin,
  EmojiPlugin,
  ImagePlugin,
  LinkPlugin,
  SylEditor,
} from '@syllepsis/access-react';
import { ToolbarInlineLoader, ToolbarLoader } from '@syllepsis/editor';
import {
  AlignCenterPlugin,
  AlignJustifyPlugin,
  AlignLeftPlugin,
  AlignRightPlugin,
  AudioPlugin,
  BlockQuotePlugin,
  BoldPlugin,
  BulletListPlugin,
  FontSizePlugin,
  FormatClearPlugin,
  FormatPainterPlugin,
  HeaderPlugin,
  HrPlugin,
  ItalicPlugin,
  LetterSpacePlugin,
  LineHeightPlugin,
  LineIndentPlugin,
  ListItemPlugin,
  OrderedListPlugin,
  ParagraphPlugin,
  RedoPlugin,
  SpaceAfterPlugin,
  SpaceBeforePlugin,
  SpaceBothPlugin,
  StrikePlugin,
  SubPlugin,
  SupPlugin,
  UnderlinePlugin,
  UndoPlugin,
  VideoPlugin,
} from '@syllepsis/plugin-basic';
import React, { useState } from 'react';
import '@syllepsis/plugin-basic/assets/style.css';

const RichEditor = ({ getEditor, extraPlugins }) => {
  const [plugins] = useState([
    new RedoPlugin(),
    new UndoPlugin(),
    new BoldPlugin(),
    new BlockQuotePlugin(),
    new ListItemPlugin({
      allowedLineHeights: [],
      allowedSpaceBefores: [],
      allowedSpaceAfters: [],
      allowedSpaceBoths: [],
    }),
    new BulletListPlugin(),
    new OrderedListPlugin(),
    new HrPlugin(),
    new HeaderPlugin(),
    new ItalicPlugin(),
    new SubPlugin(),
    new SupPlugin(),
    new StrikePlugin(),
    new UnderlinePlugin(),
    new ParagraphPlugin({
      allowedLineHeights: [],
      allowedLineIndents: [],
      allowedSpaceBefores: [],
      allowedSpaceAfters: [],
      allowedSpaceBoths: [],
    }),
    new FormatClearPlugin(),
    new FontSizePlugin({
      allowedValues: [],
      values: [12, 14, 16, { value: 17, default: true }, 18, 20, 24, 32],
      unit: 'px',
    }),
    new LetterSpacePlugin({
      allowedValues: [0, 0.5, 1, 1.5],
    }),
    new AlignLeftPlugin(),
    new AlignCenterPlugin(),
    new AlignRightPlugin(),
    new AlignJustifyPlugin(),
    new SpaceBeforePlugin({
      values: [0, 4, 8, 12, 16, { value: 20, default: true }, 24, 28, 30],
    }),
    new SpaceAfterPlugin({
      values: [0, 4, 8, 12, 16, { value: 20, default: true }, 24, 28, 30],
    }),
    new SpaceBothPlugin({
      values: [0, 4, 8, 12, 16, { value: 20, default: true }, 24, 28, 30],
    }),
    new LineHeightPlugin({
      values: [1, 1.5, { value: 1.75, default: true }, 1.88, 2, 3],
    }),
    new LineIndentPlugin(),
    new FormatPainterPlugin(),
    new ImagePlugin({
      uploader: (f) => Promise.resolve(''),
    }),
    new VideoPlugin({
      uploader: async (file) =>
        Promise.resolve({
          src: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
          title: file.name,
        }),
    }),
    new LinkPlugin(),
    new AudioPlugin({
      uploader: (file) =>
        Promise.resolve({
          src: URL.createObjectURL(file),
        }),
    }),
    new ColorPlugin(),
    new BackgroundPlugin(),
    new EmojiPlugin(),
    ...extraPlugins,
  ]);

  const [module] = useState({
    toolbar: {
      Ctor: ToolbarLoader,
      option: {
        tools: [
          RedoPlugin.getName(),
          UndoPlugin.getName(),
          HeaderPlugin.getName(),
          BulletListPlugin.getName(),
          OrderedListPlugin.getName(),
          BlockQuotePlugin.getName(),
          BoldPlugin.getName(),
          ItalicPlugin.getName(),
          UnderlinePlugin.getName(),
          StrikePlugin.getName(),
          FontSizePlugin.getName(),
          LetterSpacePlugin.getName(),
          BackgroundPlugin.getName(),
          FormatPainterPlugin.getName(),
          ColorPlugin.getName(),
          ImagePlugin.getName(),
          VideoPlugin.getName(),
          AudioPlugin.getName(),
          HrPlugin.getName(),
          LinkPlugin.getName(),
          SubPlugin.getName(),
          SupPlugin.getName(),
          EmojiPlugin.getName(),
          [
            AlignLeftPlugin.getName(),
            AlignCenterPlugin.getName(),
            AlignRightPlugin.getName(),
            AlignJustifyPlugin.getName(),
          ],
          SpaceBeforePlugin.getName(),
          SpaceAfterPlugin.getName(),
          SpaceBothPlugin.getName(),
          LineHeightPlugin.getName(),
          LineIndentPlugin.getName(),
        ],
      },
    },
    toolbarInline: {
      Ctor: ToolbarInlineLoader,
      option: {
        tools: [
          BoldPlugin.getName(),
          ItalicPlugin.getName(),
          UnderlinePlugin.getName(),
          StrikePlugin.getName(),
          '|',
          AlignLeftPlugin.getName(),
          HeaderPlugin.getName(),
          [OrderedListPlugin.getName(), BulletListPlugin.getName()],
          'color',
        ],
      },
    },
  });

  return (
    <SylEditor
      placeholder="please input..."
      getEditor={(editor) => {
        // @ts-ignore
        window.editor = editor;
        getEditor(editor);
      }}
      plugins={plugins}
      module={module}
    />
  );
};

export { RichEditor };

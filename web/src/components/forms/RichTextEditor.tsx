import { forwardRef, useImperativeHandle } from "react";
import {
  Editor,
  EditorContent,
  useEditor,
  useEditorState,
  type EditorStateSnapshot,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button, ButtonGroup } from "flowbite-react";
import { CustomTooltip } from "../helpers/CustomTooltip";

import IconFormatBold from "~icons/mdi/format-bold";
import IconFormatItalic from "~icons/mdi/format-italic";
import IconFormatStrikethrough from "~icons/mdi/format-strikethrough";
import IconCodeTags from "~icons/mdi/code-tags";
import IconFormatClear from "~icons/mdi/format-clear";
import IconBroom from "~icons/mdi/broom";
import IconFormatListBulleted from "~icons/mdi/format-list-bulleted";
import IconFormatListNumbered from "~icons/mdi/format-list-numbered";
import IconCodeBraces from "~icons/mdi/code-braces";
import IconFormatQuoteClose from "~icons/mdi/format-quote-close";
import IconMinus from "~icons/mdi/minus";
// import IconKeyboardReturn from "~icons/mdi/keyboard-return";
import IconUndo from "~icons/mdi/undo";
import IconRedo from "~icons/mdi/redo";

export type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  isSimpleMode?: boolean;
};

export type RichTextEditorHandle = {
  focus: () => void;
};

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(({ value, onChange, isSimpleMode = false }, ref) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editor?.commands.focus("end");
      },
    }),
    [editor],
  );

  return (
    <div className="">
      {editor && <MenuBar editor={editor} isSimpleMode={isSimpleMode} />}
      <EditorContent editor={editor} />
    </div>
  );
});

export const MenuBar = ({
  editor,
  isSimpleMode,
}: {
  editor: Editor;
  isSimpleMode: boolean;
}) => {
  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="control-group">
      <ButtonGroup className="button-group">
        <CustomTooltip content="Bold" className="whitespace-nowrap">
          <Button
            color={editorState.isBold ? "dark" : "gray"}
            outline={!editorState.isBold}
            size="xs"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editorState.canBold}
            aria-label="Bold"
          >
            <IconFormatBold className="h-4 w-4" />
          </Button>
        </CustomTooltip>
        <CustomTooltip content="Italic" className="whitespace-nowrap">
          <Button
            color={editorState.isItalic ? "dark" : "gray"}
            outline={!editorState.isItalic}
            size="xs"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editorState.canItalic}
            aria-label="Italic"
          >
            <IconFormatItalic className="h-4 w-4" />
          </Button>
        </CustomTooltip>
        <CustomTooltip content="Strike" className="whitespace-nowrap">
          <Button
            color={editorState.isStrike ? "dark" : "gray"}
            outline={!editorState.isStrike}
            size="xs"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editorState.canStrike}
            aria-label="Strike"
          >
            <IconFormatStrikethrough className="h-4 w-4" />
          </Button>
        </CustomTooltip>
      </ButtonGroup>
      <ButtonGroup className="button-group">
        <CustomTooltip content="Clear marks" className="whitespace-nowrap">
          <Button
            color="gray"
            outline
            size="xs"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            disabled={!editorState.canClearMarks}
            aria-label="Clear marks"
          >
            <IconFormatClear className="h-4 w-4" />
          </Button>
        </CustomTooltip>
        {!isSimpleMode && (
          <CustomTooltip content="Clear nodes" className="whitespace-nowrap">
            <Button
              color="gray"
              outline
              size="xs"
              onClick={() => editor.chain().focus().clearNodes().run()}
              disabled={!editorState.canClearNodes}
              aria-label="Clear nodes"
            >
              <IconBroom className="h-4 w-4" />
            </Button>
          </CustomTooltip>
        )}
      </ButtonGroup>
      {!isSimpleMode && (
        <ButtonGroup className="button-group">
          <CustomTooltip content="Paragraph" className="whitespace-nowrap">
            <Button
              color={editorState.isParagraph ? "dark" : "gray"}
              outline={!editorState.isParagraph}
              size="xs"
              onClick={() => editor.chain().focus().setParagraph().run()}
              aria-label="Paragraph"
            >
              P
            </Button>
          </CustomTooltip>
          <CustomTooltip content="H1" className="whitespace-nowrap">
            <Button
              color={editorState.isHeading1 ? "dark" : "gray"}
              outline={!editorState.isHeading1}
              size="xs"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              aria-label="Heading 1"
            >
              H1
            </Button>
          </CustomTooltip>
          <CustomTooltip content="H2" className="whitespace-nowrap">
            <Button
              color={editorState.isHeading2 ? "dark" : "gray"}
              outline={!editorState.isHeading2}
              size="xs"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              aria-label="Heading 2"
            >
              H2
            </Button>
          </CustomTooltip>
          <CustomTooltip content="H3" className="whitespace-nowrap">
            <Button
              color={editorState.isHeading3 ? "dark" : "gray"}
              outline={!editorState.isHeading3}
              size="xs"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              aria-label="Heading 3"
            >
              H3
            </Button>
          </CustomTooltip>
          <CustomTooltip content="H4" className="whitespace-nowrap">
            <Button
              color={editorState.isHeading4 ? "dark" : "gray"}
              outline={!editorState.isHeading4}
              size="xs"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 4 }).run()
              }
              aria-label="Heading 4"
            >
              H4
            </Button>
          </CustomTooltip>
          {/* <CustomTooltip content="H5" className="whitespace-nowrap">
          <Button
            color={editorState.isHeading5 ? "dark" : "gray"}
            outline={!editorState.isHeading5}
            size="xs"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 5 }).run()
            }
            aria-label="Heading 5"
          >
            H5
          </Button>
        </CustomTooltip>
        <CustomTooltip content="H6" className="whitespace-nowrap">
          <Button
            color={editorState.isHeading6 ? "dark" : "gray"}
            outline={!editorState.isHeading6}
            size="xs"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 6 }).run()
            }
            aria-label="Heading 6"
          >
            H6
          </Button>
        </CustomTooltip> */}
        </ButtonGroup>
      )}
      <ButtonGroup className="button-group">
        <CustomTooltip content="Bullet list" className="whitespace-nowrap">
          <Button
            color={editorState.isBulletList ? "dark" : "gray"}
            outline={!editorState.isBulletList}
            size="xs"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <IconFormatListBulleted className="h-4 w-4" />
          </Button>
        </CustomTooltip>
        <CustomTooltip content="Ordered list" className="whitespace-nowrap">
          <Button
            color={editorState.isOrderedList ? "dark" : "gray"}
            outline={!editorState.isOrderedList}
            size="xs"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered list"
          >
            <IconFormatListNumbered className="h-4 w-4" />
          </Button>
        </CustomTooltip>
      </ButtonGroup>
      {!isSimpleMode && (
        <ButtonGroup className="button-group">
          <CustomTooltip content="Code" className="whitespace-nowrap">
            <Button
              color={editorState.isCode ? "dark" : "gray"}
              outline={!editorState.isCode}
              size="xs"
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editorState.canCode}
              aria-label="Code"
            >
              <IconCodeTags className="h-4 w-4" />
            </Button>
          </CustomTooltip>
          <CustomTooltip content="Code block" className="whitespace-nowrap">
            <Button
              color={editorState.isCodeBlock ? "dark" : "gray"}
              outline={!editorState.isCodeBlock}
              size="xs"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              aria-label="Code block"
            >
              <IconCodeBraces className="h-4 w-4" />
            </Button>
          </CustomTooltip>
          <CustomTooltip content="Blockquote" className="whitespace-nowrap">
            <Button
              color={editorState.isBlockquote ? "dark" : "gray"}
              outline={!editorState.isBlockquote}
              size="xs"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              aria-label="Blockquote"
            >
              <IconFormatQuoteClose className="h-4 w-4" />
            </Button>
          </CustomTooltip>
        </ButtonGroup>
      )}
      {!isSimpleMode && (
        <ButtonGroup className="button-group">
          <CustomTooltip
            content="Horizontal rule"
            className="whitespace-nowrap"
          >
            <Button
              color="gray"
              outline
              size="xs"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              aria-label="Horizontal rule"
            >
              <IconMinus className="h-4 w-4" />
            </Button>
          </CustomTooltip>
          {/* <CustomTooltip content="Hard break" className="whitespace-nowrap">
          <Button
            color="gray"
            outline
            size="xs"
            onClick={() => editor.chain().focus().setHardBreak().run()}
            aria-label="Hard break"
          >
            <IconKeyboardReturn className="h-4 w-4" />
          </Button>
        </CustomTooltip> */}
        </ButtonGroup>
      )}
      <ButtonGroup className="button-group">
        <CustomTooltip content="Undo" className="whitespace-nowrap">
          <Button
            color="gray"
            outline
            size="xs"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editorState.canUndo}
            aria-label="Undo"
          >
            <IconUndo className="h-4 w-4" />
          </Button>
        </CustomTooltip>
        <CustomTooltip content="Redo" className="whitespace-nowrap">
          <Button
            color="gray"
            outline
            size="xs"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editorState.canRedo}
            aria-label="Redo"
          >
            <IconRedo className="h-4 w-4" />
          </Button>
        </CustomTooltip>
      </ButtonGroup>
    </div>
  );
};

function menuBarStateSelector(ctx: EditorStateSnapshot<Editor>) {
  return {
    // Text formatting
    isBold: ctx.editor.isActive("bold") ?? false,
    canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
    isItalic: ctx.editor.isActive("italic") ?? false,
    canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
    isStrike: ctx.editor.isActive("strike") ?? false,
    canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
    isCode: ctx.editor.isActive("code") ?? false,
    canCode: ctx.editor.can().chain().toggleCode().run() ?? false,
    canClearMarks: ctx.editor.can().chain().unsetAllMarks().run() ?? false,
    canClearNodes: ctx.editor.can().chain().clearNodes().run() ?? false,

    // Block types
    isParagraph: ctx.editor.isActive("paragraph") ?? false,
    isHeading1: ctx.editor.isActive("heading", { level: 1 }) ?? false,
    isHeading2: ctx.editor.isActive("heading", { level: 2 }) ?? false,
    isHeading3: ctx.editor.isActive("heading", { level: 3 }) ?? false,
    isHeading4: ctx.editor.isActive("heading", { level: 4 }) ?? false,
    isHeading5: ctx.editor.isActive("heading", { level: 5 }) ?? false,
    isHeading6: ctx.editor.isActive("heading", { level: 6 }) ?? false,

    // Lists and blocks
    isBulletList: ctx.editor.isActive("bulletList") ?? false,
    isOrderedList: ctx.editor.isActive("orderedList") ?? false,
    isCodeBlock: ctx.editor.isActive("codeBlock") ?? false,
    isBlockquote: ctx.editor.isActive("blockquote") ?? false,

    // History
    canUndo: ctx.editor.can().chain().undo().run() ?? false,
    canRedo: ctx.editor.can().chain().redo().run() ?? false,
  };
}

export type MenuBarState = ReturnType<typeof menuBarStateSelector>;

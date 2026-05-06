import { forwardRef, useEffect, useImperativeHandle } from "react";
import {
  Editor,
  EditorContent,
  useEditor,
  useEditorState,
  type EditorStateSnapshot,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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
import { ButtonGroup } from "../ui/button-group";
import { Button } from "../ui/button";

export type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isSimpleMode?: boolean;
};

export type RichTextEditorHandle = {
  focus: () => void;
};

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(({ value, onChange, isSimpleMode = false, disabled = false }, ref) => {
  const editor = useEditor({
    editable: !disabled,
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    const normalizedValue = value || "";
    const isEquivalentEmpty =
      normalizedValue.trim() === "" && currentHtml.trim() === "<p></p>";

    const currentHtmlIsEmpty =
      currentHtml.trim() === "" || currentHtml.trim() === "<p></p>";

    if (currentHtmlIsEmpty && !isEquivalentEmpty) {
      // Sync external updates (for async-loaded form values) without triggering onUpdate.
      editor.commands.setContent(normalizedValue);
    }
  }, [value]);

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
      {editor && !disabled && (
        <MenuBar editor={editor} isSimpleMode={isSimpleMode} />
      )}
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
            variant={!editorState.isBold ? "secondary" : "outline"}
            size="sm"
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
            variant={!editorState.isItalic ? "secondary" : "outline"}
            size="sm"
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
            variant={!editorState.isStrike ? "secondary" : "outline"}
            size="sm"
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
            variant="outline"
            size="sm"
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
              variant="outline"
              size="sm"
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
              variant={!editorState.isParagraph ? "secondary" : "outline"}
              size="sm"
              onClick={() => editor.chain().focus().setParagraph().run()}
              aria-label="Paragraph"
            >
              P
            </Button>
          </CustomTooltip>
          <CustomTooltip content="H1" className="whitespace-nowrap">
            <Button
              color={editorState.isHeading1 ? "dark" : "gray"}
              variant={!editorState.isHeading1 ? "secondary" : "outline"}
              size="sm"
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
              variant={!editorState.isHeading2 ? "secondary" : "outline"}
              size="sm"
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
              variant={!editorState.isHeading3 ? "secondary" : "outline"}
              size="sm"
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
              variant={!editorState.isHeading4 ? "secondary" : "outline"}
              size="sm"
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
            variant={!editorState.isHeading5 ? 'secondary' : 'outline'}
            size="sm"
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
            variant={!editorState.isHeading6 ? 'secondary' : 'outline'}
            size="sm"
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
            variant={!editorState.isBulletList ? "secondary" : "outline"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <IconFormatListBulleted className="h-4 w-4" />
          </Button>
        </CustomTooltip>
        <CustomTooltip content="Ordered list" className="whitespace-nowrap">
          <Button
            color={editorState.isOrderedList ? "dark" : "gray"}
            variant={!editorState.isOrderedList ? "secondary" : "outline"}
            size="sm"
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
              variant={!editorState.isCode ? "secondary" : "outline"}
              size="sm"
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
              variant={!editorState.isCodeBlock ? "secondary" : "outline"}
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              aria-label="Code block"
            >
              <IconCodeBraces className="h-4 w-4" />
            </Button>
          </CustomTooltip>
          <CustomTooltip content="Blockquote" className="whitespace-nowrap">
            <Button
              color={editorState.isBlockquote ? "dark" : "gray"}
              variant={!editorState.isBlockquote ? "secondary" : "outline"}
              size="sm"
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
              variant="outline"
              size="sm"
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
            size="sm"
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
            variant="outline"
            size="sm"
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
            variant="outline"
            size="sm"
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

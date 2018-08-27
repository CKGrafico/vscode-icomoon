import { window, TextDocument, workspace, Uri, Range, TextEditor, TextEditorDecorationType } from 'vscode';
import * as glob from 'glob';
import { Icon } from './icon';

export class IcomoonViewer {
    private languages = ['css', 'scss', 'sass', 'less'];
    private icons: Icon[];

    private get editor(): TextEditor {
        return window.activeTextEditor;
    }

    private get document(): TextDocument {
        return this.editor.document;
    }

    public async update(): Promise<void> {
        if (!this.languages.includes(this.document.languageId)) {
            return;
        }

        if (!this.icons) {
            await this.getIcons();
        }

        this.showIcons();
    }

    private showIcons(): void {
        const editor = this.editor as any;

        editor.decorations = editor.decorations || [];
        editor.decorations.forEach(x => x.dispose());

        this.icons.forEach(icon => {
            const renderOptions = {
                before: {
                    contentIconPath: Uri.parse(`data:image/svg+xml;utf8,${encodeURI(this.svgTemplate(icon))}`),
                    margin: '0 .1em .1em 0',
                    width: '1.1em',
                },
            };

            const decoration = window.createTextEditorDecorationType(renderOptions);
            const ranges = this.extractIconsFromCSS(icon);

            if (!ranges || ranges.length < 1) {
                return;
            }

            this.showDecoration(decoration, ranges);
            editor.decorations.push(decoration);
        });
    }

    private showDecoration(decoration: TextEditorDecorationType, ranges: Range[]): void {
        window.visibleTextEditors
                .forEach(editor => editor.setDecorations(decoration, ranges));
    }

    private svgTemplate(icon: Icon): string {
        const size = 1024;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 64 ${size} ${size}"><rect height="${size}" width="${size}" x="0" y="0" fill="rgba(0, 0, 0, .1)" /><path transform-origin="${size / 2} ${size / 2}" transform="scale(.75 -.75)" fill="rgba(255, 255, 255, .75)" d="${icon.content}"/></svg>`;
    }

    private extractIconsFromDoc(doc: TextDocument): Icon[] {
        let icons: Icon[] = [];
        let docContent = doc.getText();
        const reg = /(unicode="&#x)(.*?)(;")(.*?)(d=")(.*?)(")/g;
        let match;

        while ((match = reg.exec(docContent))) {
            if (!match.length || !match[2] || !match[6]) {
                return;
            }

            icons.push(new Icon(match[2], match[6]));
         }

        return icons;
    }

    private extractIconsFromCSS(icon: Icon): Range[] {
        let ranges: Range[] = [];
        let docContent = this.document.getText();
        const reg = new RegExp(`('|")(\\\\?)${icon.code}('|");?`, 'g');
        let match;

        while ((match = reg.exec(docContent))) {
            if (!match.length || !match.index || !match[0]) {
                return;
            }

            const position = this.document.positionAt(match.index + match[0].length);
            ranges.push(new Range(position.line, position.character, position.line, position.character));
         }

        return ranges;
    }

    private async getIcons(): Promise<{}> {
        return new Promise((resolve, reject) => {
            glob(`${workspace.rootPath}/**/*icomoon*.svg`, { ignore: '**/node_modules/**' }, async (error, files) => {
                if (error || !files || !files.length || !files[0]) {
                    reject();
                }
    
                let openPath = Uri.file(files[0]);
                const doc = await workspace.openTextDocument(openPath);
                this.icons = this.extractIconsFromDoc(doc);
                resolve();
            });
        });
    }

    public dispose(): void {}
}

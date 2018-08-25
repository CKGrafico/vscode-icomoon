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
        this.icons.forEach(icon => {
            const renderOptions = {
                before: {
                    contentIconPath: Uri.parse(`data:image/svg+xml;utf8,${encodeURI(this.svgTemplate(icon))}`),
                    margin: '0 .1em',
                    width: '1em',
                },
            };

            const decoration = window.createTextEditorDecorationType(renderOptions);
            const ranges = this.extractIconsFromCSS(icon);

            if (!ranges || ranges.length < 1) {
                return;
            }

            this.showDecoration(decoration, ranges);
        });
    }

    private showDecoration(decoration: TextEditorDecorationType, ranges: Range[]): void {
        window.visibleTextEditors
                .forEach(editor => editor.setDecorations(decoration, ranges));
    }

    private svgTemplate(icon: Icon): string {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 64 1024 1024"><path transform="rotate(180 512 512) scale(.9)" fill="#FFFFFF" d="${icon.content}"/></svg>`;
    }

    private extractIconsFromDoc(doc: TextDocument): Icon[] {
        let icons: Icon[] = [];
        let docContent = doc.getText();
        const reg = /(unicode="&#x)(.+)(;")(.+)(d=")(.+)(")/g;
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
        const reg = new RegExp(`('|")${icon.code}('|");?`, 'g');
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
        // TODO: Icomoon and icomoon
        return new Promise((resolve, reject) => {
            glob(`${workspace.rootPath}/**/icomoon.svg` , {}, async (error, files) => {
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
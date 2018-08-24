import { window, TextDocument, workspace, Uri, Range } from 'vscode';
import * as path from 'path';
import * as glob from 'glob';
import { Icon } from './icon';

export class IcomoonViewer {
    private languages = ['css', 'scss', 'less'];
    private icons: Icon[];

    public async update(): Promise<void> {

        // Get the current text editor
        let editor = window.activeTextEditor;
        let doc = editor.document;

        if (!this.languages.includes(doc.languageId)) {
            return;
        }

        if (!this.icons) {
            await this.getIcons();
        }

        this.showIcons();
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

    private extractIconsFromCSS(doc: TextDocument, icon: Icon): Range[] {
        let ranges: Range[] = [];
        let docContent = doc.getText();
        const reg = new RegExp(`${icon.code}`, 'g');
        let match;

        while ((match = reg.exec(docContent))) {
            if (!match.length || !match.index || !match[0]) {
                return;
            }

            const position = doc.positionAt(match.index + match[0].length + `'.`.length);
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

    private showIcons(): void {
        // TODO: Separate in functions
        const defaultRenderOptions = {
            after: {
                contentText: ' ',
                margin: '0.1em 0.2em 0 0.2em',
                width: '0.7em',
                height: '0.7em',
                backgroundColor: 'red',
                borderRadius: '50%'
            }
        };

        this.icons.forEach(icon => {
            const renderOptions = {
                ...defaultRenderOptions,

            };

            const decoration = window.createTextEditorDecorationType(renderOptions);

            // Get the coords
            let editor = window.activeTextEditor;
            const ranges = this.extractIconsFromCSS(editor.document, icon);

            // Show the decoration
            window.visibleTextEditors
                .forEach(editor => editor.setDecorations(decoration, ranges));
        });
    }

    public dispose(): void {}
}
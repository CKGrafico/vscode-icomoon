import { window, TextDocument, workspace, Uri } from 'vscode';
import * as path from 'path';
import * as glob from 'glob';
import { Icon } from './icon';

export class IcomoonViewer {
    private languages = ['css', 'scss', 'less'];
    private icons: Icon[];

    public update(): void {

        // Get the current text editor
        let editor = window.activeTextEditor;
        let doc = editor.document;

        if (!this.languages.includes(doc.languageId)) {
            return;
        }

        if (!this.icons) {
            this.getIcons();
        }
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

    private getIcons(): void {
        // TODO: Icomoon and icomoon
        glob(`${workspace.rootPath}/**/icomoon.svg` , {}, (error, files) => {
            if (error || !files || !files.length || !files[0]) {
                return;
            }

            let openPath = Uri.file(files[0]);
            workspace.openTextDocument(openPath).then(doc => {
                this.icons = this.extractIconsFromDoc(doc);
            });
        });
    }

    public dispose(): void {}
}
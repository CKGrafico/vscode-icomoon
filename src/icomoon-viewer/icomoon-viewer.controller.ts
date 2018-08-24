import { Disposable, window } from 'vscode';
import { IcomoonViewer } from './icomoon-viewer';

export class IcomoonViewerController {

    private icomoonViewer: IcomoonViewer;
    private disposable: Disposable;

    constructor(icomoonViewer: IcomoonViewer) {
        this.icomoonViewer = icomoonViewer;
        this.icomoonViewer.update();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this.onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this.disposable = Disposable.from(...subscriptions);
    }

    private onEvent() {
        this.icomoonViewer.update();
    }

    public dispose() {
        this.disposable.dispose();
    }
}
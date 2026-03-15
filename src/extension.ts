import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface DocLink {
    filePath: string;
    docPath: string;
    docTitle: string;
}

export class DocumentationMapper {
    private docLinks: Map<string, DocLink[]> = new Map();
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    public async scanDocumentation(): Promise<void> {
        const config = vscode.workspace.getConfiguration('docsCodeNavigator');
        const docsPath = config.get<string>('docsPath', 'Docs');
        const searchPatterns = config.get<string[]>('searchPatterns', ['**/*.md']);

        this.docLinks.clear();

        for (const pattern of searchPatterns) {
            const docFiles = await vscode.workspace.findFiles(
                path.join(docsPath, pattern).replace(/\\/g, '/'),
                '**/node_modules/**'
            );

            for (const docFile of docFiles) {
                await this.parseDocumentationFile(docFile);
            }
        }
    }

    private async parseDocumentationFile(docUri: vscode.Uri): Promise<void> {
        try {
            const content = await vscode.workspace.fs.readFile(docUri);
            const text = Buffer.from(content).toString('utf8');
            
            // Извлекаем заголовок документа
            const titleMatch = text.match(/^#\s+(.+)$/m);
            const docTitle = titleMatch ? titleMatch[1].trim() : path.basename(docUri.fsPath, '.md');

            // Ищем ссылки на файлы кода в формате [text](../path/to/file.ext)
            const linkRegex = /\[([^\]]+)\]\(\.\.\/([^)]+)\)/g;
            let match;

            while ((match = linkRegex.exec(text)) !== null) {
                const relativePath = match[2];
                
                // Проверяем, что это файл исходного кода
                if (this.isSourceFile(relativePath)) {
                    const fullPath = path.resolve(this.workspaceRoot, relativePath);
                    const normalizedPath = path.normalize(fullPath);

                    if (!this.docLinks.has(normalizedPath)) {
                        this.docLinks.set(normalizedPath, []);
                    }

                    this.docLinks.get(normalizedPath)!.push({
                        filePath: normalizedPath,
                        docPath: docUri.fsPath,
                        docTitle: docTitle
                    });
                }
            }
        } catch (error) {
            console.error(`Error parsing documentation file ${docUri.fsPath}:`, error);
        }
    }

    private isSourceFile(filePath: string): boolean {
        const sourceExtensions = ['.cs', '.js', '.ts', '.tsx', '.jsx', '.cpp', '.h', '.hpp', '.py', '.java'];
        const ext = path.extname(filePath);
        return sourceExtensions.includes(ext);
    }

    public getRelatedDocs(filePath: string): DocLink[] {
        const normalizedPath = path.normalize(filePath);
        return this.docLinks.get(normalizedPath) || [];
    }

    public getAllMappedFiles(): string[] {
        return Array.from(this.docLinks.keys());
    }
}

export class DocsCodeLensProvider implements vscode.CodeLensProvider {
    private documentationMapper: DocumentationMapper;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(documentationMapper: DocumentationMapper) {
        this.documentationMapper = documentationMapper;
    }

    public refresh(): void {
        this._onDidChangeCodeLenses.fire();
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        const config = vscode.workspace.getConfiguration('docsCodeNavigator');
        if (!config.get<boolean>('showCodeLens', true)) {
            return [];
        }

        const relatedDocs = this.documentationMapper.getRelatedDocs(document.fileName);
        if (relatedDocs.length === 0) {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const firstLine = new vscode.Range(0, 0, 0, 0);

        if (relatedDocs.length === 1) {
            const doc = relatedDocs[0];
            codeLenses.push(new vscode.CodeLens(firstLine, {
                title: `📖 Open: ${doc.docTitle}`,
                command: 'docsCodeNavigator.openDocumentation',
                arguments: [doc.docPath]
            }));
        } else {
            codeLenses.push(new vscode.CodeLens(firstLine, {
                title: `📖 Related Documentation (${relatedDocs.length})`,
                command: 'docsCodeNavigator.showDocumentationMenu',
                arguments: [relatedDocs]
            }));
        }

        return codeLenses;
    }
}

let documentationMapper: DocumentationMapper;
let codeLensProvider: DocsCodeLensProvider;

export function activate(context: vscode.ExtensionContext) {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    documentationMapper = new DocumentationMapper(workspaceRoot);
    codeLensProvider = new DocsCodeLensProvider(documentationMapper);

    // Регистрируем CodeLens провайдер
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            [{ scheme: 'file', language: 'csharp' }, 
             { scheme: 'file', language: 'typescript' }, 
             { scheme: 'file', language: 'javascript' }],
            codeLensProvider
        )
    );

    // Команда для открытия документации
    context.subscriptions.push(
        vscode.commands.registerCommand('docsCodeNavigator.openDocumentation', async (docPath: string) => {
            const uri = vscode.Uri.file(docPath);
            await vscode.commands.executeCommand('vscode.openWith', uri, 'vscode.markdown.preview.editor');
        })
    );

    // Команда для отображения меню с несколькими документами
    context.subscriptions.push(
        vscode.commands.registerCommand('docsCodeNavigator.showDocumentationMenu', async (docs: DocLink[]) => {
            const items = docs.map(doc => ({
                label: doc.docTitle,
                description: path.relative(workspaceRoot, doc.docPath),
                docPath: doc.docPath
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select documentation to open'
            });

            if (selected) {
                await vscode.commands.executeCommand('docsCodeNavigator.openDocumentation', selected.docPath);
            }
        })
    );

    // Команда для открытия связанной документации из контекстного меню
    context.subscriptions.push(
        vscode.commands.registerCommand('docsCodeNavigator.openRelatedDocs', async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                return;
            }

            const relatedDocs = documentationMapper.getRelatedDocs(activeEditor.document.fileName);
            if (relatedDocs.length === 0) {
                vscode.window.showInformationMessage('No related documentation found for this file.');
                return;
            }

            if (relatedDocs.length === 1) {
                await vscode.commands.executeCommand('docsCodeNavigator.openDocumentation', relatedDocs[0].docPath);
            } else {
                await vscode.commands.executeCommand('docsCodeNavigator.showDocumentationMenu', relatedDocs);
            }
        })
    );

    // Команда для обновления ссылок на документацию
    context.subscriptions.push(
        vscode.commands.registerCommand('docsCodeNavigator.refreshDocLinks', async () => {
            await documentationMapper.scanDocumentation();
            codeLensProvider.refresh();
            vscode.window.showInformationMessage('Documentation links refreshed.');
        })
    );

    // Первоначальное сканирование документации
    documentationMapper.scanDocumentation().then(() => {
        codeLensProvider.refresh();
    });

    // Автоматическое обновление при изменении файлов документации
    const watcher = vscode.workspace.createFileSystemWatcher('**/Docs/**/*.md');
    watcher.onDidChange(() => {
        documentationMapper.scanDocumentation().then(() => {
            codeLensProvider.refresh();
        });
    });
    watcher.onDidCreate(() => {
        documentationMapper.scanDocumentation().then(() => {
            codeLensProvider.refresh();
        });
    });
    watcher.onDidDelete(() => {
        documentationMapper.scanDocumentation().then(() => {
            codeLensProvider.refresh();
        });
    });

    context.subscriptions.push(watcher);
}

export function deactivate() {}

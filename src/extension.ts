import * as vscode from 'vscode';
import * as path from 'path';

interface DocLink {
	filePath: string;
	docPath: string;
	docTitle: string;
}

const DEFAULT_DOCS_PATH = 'docs';

function normalizeDocsDirectoryPath(docsPath: string): string {
    return docsPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function getDocumentationDirectoryPaths(docsPath: string): string[] {
    const normalizedDocsPath = normalizeDocsDirectoryPath(docsPath) || DEFAULT_DOCS_PATH;
    const docsDirectoryPaths = new Set<string>([normalizedDocsPath]);

    if (normalizedDocsPath.toLowerCase() === 'docs') {
        docsDirectoryPaths.add('docs');
        docsDirectoryPaths.add('Docs');
    }

    return Array.from(docsDirectoryPaths);
}

function getPathComparisonKey(filePath: string): string {
	const normalizedFilePath = path.normalize(filePath);
	return process.platform === 'win32' ? normalizedFilePath.toLowerCase() : normalizedFilePath;
}

function extractMarkdownLinkTarget(rawTarget: string): string {
	const trimmedTarget = rawTarget.trim();
	if (!trimmedTarget) {
		return '';
	}

	// Поддержка варианта ссылок с обрамлением в угловые скобки.
	if (trimmedTarget.startsWith('<') && trimmedTarget.endsWith('>')) {
		return trimmedTarget.slice(1, -1).trim();
	}

	// Отбрасываем возможный title после пробела: (path "title")
	const firstWhitespaceIndex = trimmedTarget.search(/\s/);
	if (firstWhitespaceIndex !== -1) {
		return trimmedTarget.slice(0, firstWhitespaceIndex).trim();
	}

	return trimmedTarget;
}

function stripQueryAndAnchor(linkTarget: string): string {
	const queryIndex = linkTarget.indexOf('?');
	const anchorIndex = linkTarget.indexOf('#');

	let truncateIndex = -1;
	if (queryIndex !== -1 && anchorIndex !== -1) {
		truncateIndex = Math.min(queryIndex, anchorIndex);
	} else if (queryIndex !== -1) {
		truncateIndex = queryIndex;
	} else if (anchorIndex !== -1) {
		truncateIndex = anchorIndex;
	}

	return truncateIndex === -1 ? linkTarget : linkTarget.slice(0, truncateIndex);
}

function isExternalLink(linkTarget: string): boolean {
	return (
		/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(linkTarget) ||
		linkTarget.startsWith('//') ||
		linkTarget.startsWith('#')
	);
}

export class DocumentationMapper {
	private docLinks: Map<string, DocLink[]> = new Map();
	private workspaceRoot: string;
	private workspaceRootComparisonKey: string;

	constructor(workspaceRoot: string) {
		this.workspaceRoot = workspaceRoot;
		this.workspaceRootComparisonKey = getPathComparisonKey(workspaceRoot);
	}

	public async scanDocumentation(): Promise<void> {
		const config = vscode.workspace.getConfiguration('docsCodeNavigator');
		const docsPath = config.get<string>('docsPath', DEFAULT_DOCS_PATH);
		const searchPatterns = config.get<string[]>('searchPatterns', ['**/*.md']);
		const docsDirectoryPaths = getDocumentationDirectoryPaths(docsPath);
		const scannedDocPaths = new Set<string>();

		this.docLinks.clear();

		for (const docsDirectoryPath of docsDirectoryPaths) {
			for (const pattern of searchPatterns) {
				const docFiles = await vscode.workspace.findFiles(
					path.posix.join(docsDirectoryPath, pattern.replace(/\\/g, '/')),
					'**/node_modules/**'
				);

				for (const docFile of docFiles) {
					const filePathComparisonKey = getPathComparisonKey(docFile.fsPath);
					if (scannedDocPaths.has(filePathComparisonKey)) {
						continue;
					}

					scannedDocPaths.add(filePathComparisonKey);
					await this.parseDocumentationFile(docFile);
				}
			}
		}
	}

	private async parseDocumentationFile(docUri: vscode.Uri): Promise<void> {
		try {
			const content = await vscode.workspace.fs.readFile(docUri);
			const text = Buffer.from(content).toString('utf8');

			// Извлекаем заголовок документа.
			const titleMatch = text.match(/^#\s+(.+)$/m);
			const docTitle = titleMatch ? titleMatch[1].trim() : path.basename(docUri.fsPath, '.md');

			// Ищем markdown-ссылки в формате [text](path).
			const linkRegex = /\[[^\]]*]\(([^)]+)\)/g;
			const docDirectoryPath = path.dirname(docUri.fsPath);
			let match: RegExpExecArray | null;

			while ((match = linkRegex.exec(text)) !== null) {
				const rawLinkTarget = match[1];
				const linkTarget = stripQueryAndAnchor(extractMarkdownLinkTarget(rawLinkTarget));
				if (!linkTarget || isExternalLink(linkTarget)) {
					continue;
				}

				let decodedLinkTarget = linkTarget;
				try {
					decodedLinkTarget = decodeURIComponent(linkTarget);
				} catch {
					// Оставляем исходное значение, если ссылка не является валидной URI-строкой.
				}

				const resolvedPath = path.isAbsolute(decodedLinkTarget)
					? path.normalize(decodedLinkTarget)
					: path.normalize(path.resolve(docDirectoryPath, decodedLinkTarget));

				if (!this.isPathInsideWorkspace(resolvedPath)) {
					continue;
				}

				const fileExists = await this.pathExists(resolvedPath);
				if (!fileExists) {
					continue;
				}

				const fileKey = getPathComparisonKey(resolvedPath);
				if (!this.docLinks.has(fileKey)) {
					this.docLinks.set(fileKey, []);
				}

				const mappedDocs = this.docLinks.get(fileKey)!;
				const hasExistingLink = mappedDocs.some((docLink) => getPathComparisonKey(docLink.docPath) === getPathComparisonKey(docUri.fsPath));
				if (hasExistingLink) {
					continue;
				}

				mappedDocs.push({
					filePath: resolvedPath,
					docPath: docUri.fsPath,
					docTitle
				});
			}
		} catch (error) {
			console.error(`Error parsing documentation file ${docUri.fsPath}:`, error);
		}
	}

	private isPathInsideWorkspace(targetPath: string): boolean {
		const targetPathKey = getPathComparisonKey(targetPath);
		if (targetPathKey === this.workspaceRootComparisonKey) {
			return true;
		}

		const relativePath = path.relative(this.workspaceRoot, targetPath);
		return relativePath !== '' && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
	}

	private async pathExists(targetPath: string): Promise<boolean> {
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(targetPath));
			return true;
		} catch {
			return false;
		}
	}

	public getRelatedDocs(filePath: string): DocLink[] {
		const key = getPathComparisonKey(filePath);
		return this.docLinks.get(key) || [];
	}

	public getAllMappedFiles(): string[] {
		const filePaths = new Set<string>();
		for (const docLinks of this.docLinks.values()) {
			for (const docLink of docLinks) {
				filePaths.add(docLink.filePath);
			}
		}

		return Array.from(filePaths);
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

	const config = vscode.workspace.getConfiguration('docsCodeNavigator');
	const docsPath = config.get<string>('docsPath', DEFAULT_DOCS_PATH);
	const docsWatcherGlobs = getDocumentationDirectoryPaths(docsPath).map((docsDirectoryPath) =>
		path.posix.join('**', docsDirectoryPath, '**/*.md')
	);

	const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
	documentationMapper = new DocumentationMapper(workspaceRoot);
	codeLensProvider = new DocsCodeLensProvider(documentationMapper);

	let scanInFlight: Promise<void> | null = null;
	const ensureScanned = async (): Promise<void> => {
		if (scanInFlight) {
			return scanInFlight;
		}

		scanInFlight = documentationMapper.scanDocumentation().finally(() => {
			scanInFlight = null;
		});

		return scanInFlight;
	};

	// Регистрируем CodeLens провайдер для любых локальных файлов.
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(
			{ scheme: 'file' },
			codeLensProvider
		)
	);

	// Команда для открытия документации.
	context.subscriptions.push(
		vscode.commands.registerCommand('docsCodeNavigator.openDocumentation', async (docPath: string) => {
			const uri = vscode.Uri.file(docPath);
			try {
				await vscode.commands.executeCommand('vscode.openWith', uri, 'vscode.markdown.preview.editor');
			} catch {
				// В некоторых окружениях markdown preview editor может быть недоступен.
				await vscode.commands.executeCommand('vscode.open', uri);
			}
		})
	);

	// Команда для отображения меню с несколькими документами.
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

	// Команда для открытия связанной документации из контекстного меню.
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

	// Команда для обновления ссылок на документацию.
	context.subscriptions.push(
		vscode.commands.registerCommand('docsCodeNavigator.refreshDocLinks', async () => {
			await ensureScanned();
			codeLensProvider.refresh();
			vscode.window.showInformationMessage('Documentation links refreshed.');
		})
	);

	// Первоначальное сканирование документации.
	ensureScanned().then(() => codeLensProvider.refresh());

	// Если файл открыт до завершения первичного сканирования — обновим CodeLens после скана.
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument((doc) => {
			if (doc.uri.scheme !== 'file') {
				return;
			}

			ensureScanned().then(() => codeLensProvider.refresh());
		})
	);

	// Автоматическое обновление при изменении файлов документации.
	for (const docsWatcherGlob of docsWatcherGlobs) {
		const watcher = vscode.workspace.createFileSystemWatcher(docsWatcherGlob);
		watcher.onDidChange(() => {
			ensureScanned().then(() => codeLensProvider.refresh());
		});
		watcher.onDidCreate(() => {
			ensureScanned().then(() => codeLensProvider.refresh());
		});
		watcher.onDidDelete(() => {
			ensureScanned().then(() => codeLensProvider.refresh());
		});

		context.subscriptions.push(watcher);
	}
}

export function deactivate() {}

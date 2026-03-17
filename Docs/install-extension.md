## Установка расширения Documentation ↔ Code Navigator

### Требования
- VS Code или Cursor;
- Node.js 16+ (для сборки расширения).

### Подготовка окружения

```bash
# Установите Node.js с официального сайта, если он ещё не установлен
# https://nodejs.org/

# Установите компилятор TypeScript глобально
npm install -g typescript

# Установите vsce для упаковки расширений
npm install -g @vscode/vsce
```

### Компиляция расширения

```bash
# В каталоге проекта расширения
npm install
npm run compile
```

### Упаковка расширения

```bash
vsce package
```

После выполнения команды будет создан файл вида `docs-code-navigator-0.1.0.vsix`.

### Установка в VS Code/Cursor

```bash
# Вариант 1: через командную строку (для VsCode и Cursor соответственно)
code --install-extension docs-code-navigator-0.1.0.vsix
cursor --install-extension docs-code-navigator-0.1.0.vsix
```

```text
# Вариант 2: через интерфейс
# 1. Откройте VS Code/Cursor
# 2. Нажмите Ctrl+Shift+P и выполните команду:
#    "Extensions: Install from VSIX..."
# 3. Выберите файл docs-code-navigator-0.1.0.vsix
```

### Проверка работы

1. Откройте тестовый проект (например, Unity‑проект) в VS Code/Cursor.
2. Убедитесь, что в корне проекта есть папка `Docs/` с корректно оформленными `.md`‑файлами, содержащими относительные ссылки на файлы кода.
3. Откройте любой файл исходного кода, на который есть ссылки из документации.  
   В начале файла должна появиться строка CodeLens вида:

```text
📖 Open: Название документа
```

4. Нажмите на ссылку — связанный документ должен открыться в режиме предпросмотра.
5. В контекстном меню файла должны быть доступны команды:
   - «Open Related Documentation»;
   - кнопка «Refresh Documentation Links» в заголовке редактора.

### Настройка

Откройте настройки VS Code/Cursor и найдите блок **Documentation Code Navigator**:

- `docsCodeNavigator.docsPath` — путь к каталогу документации (по умолчанию `"Docs"`);
- `docsCodeNavigator.showCodeLens` — показывать CodeLens‑ссылки (по умолчанию `true`);
- `docsCodeNavigator.searchPatterns` — паттерны поиска `.md`‑файлов (по умолчанию `["**/*.md"]`).

### Отладка

Если расширение не загружается:
1. Откройте Developer Tools (Help → Toggle Developer Tools).
2. Проверьте консоль на наличие ошибок.
3. Убедитесь, что расширение активно в списке установленных расширений.

Если ссылки не появляются:
1. Откройте Command Palette (Ctrl+Shift+P).
2. Выполните команду `Refresh Documentation Links`.
3. Проверьте, что в документации используются корректные относительные ссылки вида:

```markdown
- [Исходный код расширения](../src/extension.ts)
```

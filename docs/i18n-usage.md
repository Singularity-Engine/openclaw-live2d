# i18n (国际化) 使用指南

本项目使用 i18next 实现多语言支持，目前支持英语和中文。

## 目录结构

```
src/renderer/src/
├── i18n.ts                   # i18next 配置文件
├── locales/                  # 翻译文件目录
│   ├── en/                   # 英语翻译
│   │   └── translation.json  # 英语翻译文件
│   └── zh/                   # 中文翻译
│       └── translation.json  # 中文翻译文件
```

## 使用方法

### 在组件中使用

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  // 获取翻译函数和其他国际化工具
  const { t, i18n } = useTranslation();
  
  // 使用 t 函数翻译文本
  return (
    <div>
      <h1>{t('common.settings')}</h1>
      <p>{t('settings.general.language')}</p>
      
      {/* 改变语言 */}
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('zh')}>中文</button>
    </div>
  );
}
```

### 添加新的翻译

1. 在代码中使用 `t('your.translation.key')` 添加新的翻译键
2. 运行扫描命令提取翻译键：

```bash
npm run extract-translations
```

3. 添加的翻译键会更新到 `src/renderer/src/locales/en/translation.json` 和 `src/renderer/src/locales/zh/translation.json` 文件中
4. 编辑中文翻译文件，为每个键添加对应的中文翻译

## 翻译键命名规则

我们使用点号分隔的命名空间来组织翻译键，例如：

- `common.save` - 通用的"保存"按钮文本
- `settings.general.language` - 设置页面中的语言设置项

## 嵌套翻译

对于包含变量的文本，可以使用插值：

```tsx
// 在翻译文件中
{
  "welcome": "欢迎, {{name}}!"
}

// 在组件中
t('welcome', { name: 'John' }) // "欢迎, John!"
```

## 自动检测语言

系统会自动检测用户的浏览器语言设置，并使用最接近的可用语言。用户也可以手动切换语言，选择会被保存在 localStorage 中。 
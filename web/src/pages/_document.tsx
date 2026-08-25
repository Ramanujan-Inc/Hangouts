import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Hangout - Your group's shared memory, together. A cross-platform companion web app for archiving group memories, timeline, map location history, and sharing notes & expenses." />
        <meta name="theme-color" content="#fbf3ec" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('hangout_theme');
                  var theme = 'light';
                  if (stored === 'dark') {
                    theme = 'dark';
                  } else if (stored === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) meta.setAttribute('content', theme === 'dark' ? '#141110' : '#fbf3ec');
                } catch (e) {}
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

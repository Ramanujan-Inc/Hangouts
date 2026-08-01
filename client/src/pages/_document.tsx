import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Hangout - Your group's shared memory, together. A cross-platform companion web app for archiving group memories, timeline, map location history, and sharing notes & expenses." />
        <meta name="theme-color" content="#fbf3ec" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

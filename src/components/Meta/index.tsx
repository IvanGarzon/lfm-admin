'use client';

import { NextSeo } from 'next-seo';
import Head from 'next/head';
import { site } from '@/config/site';

type IMetaProps = {
  title: string;
  description: string;
  canonical?: string;
};

export const Meta = (props: IMetaProps) => {
  return (
    <>
      <Head children={undefined}>
        {/* <meta charSet="UTF-8" key="charset" />
        <meta name="description" content="Las Flores Melbourne" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
        <meta name="application-name" content="&nbsp;" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <meta name="msapplication-TileImage" content="./static/favicon/mstile-144x144.png" />
        <meta name="msapplication-square70x70logo" content="./static/favicon/mstile-70x70.png" />
        <meta
          name="msapplication-square150x150logo"
          content="./static/favicon/mstile-150x150.png"
        />
        <meta name="msapplication-wide310x150logo" content="./static/favicon/mstile-310x150.png" />
        <meta
          name="msapplication-square310x310logo"
          content="./static/favicon/mstile-310x310.png"
        />

        <link
          rel="apple-touch-icon-precomposed"
          sizes="57x57"
          href="./static/favicon/apple-touch-icon.png"
          key="apple57"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="114x114"
          href="./static/favicon/apple-touch-icon-114x114.png"
          key="apple114"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="72x72"
          href="./static/favicon/apple-touch-icon-72x72.png"
          key="apple72"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="144x144"
          href="./static/favicon/apple-touch-icon-144x144.png"
          key="apple144"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="60x60"
          href="./static/favicon/apple-touch-icon-60x60.png"
          key="apple60"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="120x120"
          href="./static/favicon/apple-touch-icon-120x120.png"
          key="apple120"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="76x76"
          href="./static/favicon/apple-touch-icon-76x76.png"
          key="apple76"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="152x152"
          href="./static/favicon/apple-touch-icon-152x152.png"
          key="apple152"
        />
        <link
          rel="icon"
          type="image/png"
          href="./static/favicon/favicon-196x196.png"
          sizes="196x196"
          key="icon196"
        />
        <link
          rel="icon"
          type="image/png"
          href="./static/favicon/favicon-96x96.png"
          sizes="96x96"
          key="icon96"
        />
        <link
          rel="icon"
          type="image/png"
          href="./static/favicon/favicon-32x32.png"
          sizes="32x32"
          key="icon196"
        />
        <link
          rel="icon"
          type="image/png"
          href="./static/favicon/favicon-16x16.png"
          sizes="16x16"
          key="icon16"
        />
        <link
          rel="icon"
          type="image/png"
          href="./static/favicon/favicon-128.png"
          sizes="128x128"
          key="icon128"
        />
        <link rel="icon" href="./static/favicon/favicon.ico" key="favicon" /> */}

        {/* 
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" /> 
        */}
      </Head>
      <NextSeo
        title={props.title}
        description={props.description}
        canonical={props.canonical}
        openGraph={{
          title: props.title,
          description: props.description,
          url: props.canonical,
          locale: site.locale,
          siteName: site.name,
        }}
      />
    </>
  );
};

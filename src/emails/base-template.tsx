import React from 'react';
import { Body, Container, Head, Html, Preview, Img } from '@react-email/components';
// import { EmailFooter } from './footer';
import { absoluteUrl } from '@/lib/utils';
import { styles as emailStyles } from './styles';

export function BaseTemplateEmail({
  children,
  previewText,
}: {
  children: React.ReactNode;
  previewText: string;
}): React.ReactElement {
  const { main, container, logo } = emailStyles;
  const logoUrl = absoluteUrl('/static/logo-green-800.png');

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ ...main }}>
        <Container
          style={{
            background: 'transparent !important',
            padding: '30px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
        </Container>
        <Container style={{ ...container }}>
            <Img
            src={logoUrl}
            width='150'
            height='150'
            alt="Las Flores Melbourne"
            style={{ ...logo }}
          />
            {children}
            </Container>
        {/* <Container>
          <EmailFooter />
        </Container> */}
      </Body>
    </Html>
  );
}

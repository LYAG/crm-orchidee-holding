'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { useServerInsertedHTML } from 'next/navigation';
import React from 'react';

export const BRAND_GREEN = '#5B8C5A';
export const BRAND_GREEN_DARK = '#1C3A1C';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  const [cache] = React.useState(() => createCache());

  useServerInsertedHTML(() => (
    <style
      id="antd"
      dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }}
    />
  ));

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        locale={frFR}
        theme={{
          token: {
            /* Brand */
            colorPrimary: BRAND_GREEN,
            colorSuccess: '#388E3C',
            colorWarning: '#F57C00',
            colorError: '#D32F2F',
            colorInfo: '#1565C0',

            /* Surfaces */
            colorBgLayout: '#F5F7F5',
            colorBgContainer: '#FFFFFF',

            /* Borders */
            colorBorder: '#DDE7DD',
            colorBorderSecondary: '#EEF4EE',
            borderRadius: 8,
            borderRadiusLG: 12,
            borderRadiusSM: 6,
            borderRadiusXS: 4,

            /* Typography */
            fontFamily:
              'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: 14,
            fontSizeLG: 16,
            fontSizeXL: 20,

            /* Elevation */
            boxShadow:
              '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
            boxShadowSecondary:
              '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.05)',

            /* Motion */
            motionDurationSlow: '0.25s',
            motionDurationMid: '0.18s',
            motionDurationFast: '0.12s',

            /* Spacing */
            padding: 16,
            paddingLG: 24,
          },
          components: {
            Card: {
              boxShadow:
                '0 1px 3px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
              borderRadiusLG: 12,
            },
            Table: {
              headerBg: '#F8FBF8',
              headerColor: '#3D5C3D',
              rowHoverBg: '#F2F8F2',
              borderColor: '#EEF4EE',
            },
            Menu: {
              itemBorderRadius: 8,
              subMenuItemBg: 'transparent',
            },
            Tag: {
              borderRadiusSM: 6,
            },
            Badge: {
              colorBgContainer: '#FFFFFF',
            },
            Button: {
              borderRadius: 8,
              primaryShadow: '0 2px 6px rgba(91,140,90,0.28)',
            },
            Input: {
              borderRadius: 8,
            },
            Select: {
              borderRadius: 8,
            },
            DatePicker: {
              borderRadius: 8,
            },
            Drawer: {
              borderRadiusLG: 0,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}

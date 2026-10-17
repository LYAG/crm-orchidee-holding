'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { App, ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';
import { useServerInsertedHTML } from 'next/navigation';
import React from 'react';

/*
 * Palette Saphir OH — doit rester alignée avec les variables `--oh-*` de globals.css.
 * Vert Orchidée en couleur d'action unique ; neutres légèrement teintés de vert.
 */
export const BRAND_GREEN = '#0F6E52';
export const BRAND_GREEN_DARK = '#123832';

const INK = '#123832';
const INK_2 = '#4E6A63';
const INK_3 = '#627A74';
const LINE = '#E3EAE7';
const LINE_STRONG = '#D6DFDB';
const SURFACE_SUNKEN = '#F5F7F6';
const BRAND_SUBTLE = '#E8F2EE';

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
            /* Brand & sémantique */
            colorPrimary: BRAND_GREEN,
            colorLink: BRAND_GREEN,
            colorSuccess: '#1E7A4C',
            colorWarning: '#C26100',
            colorError: '#C2362F',
            colorInfo: '#1F5FA8',
            colorSuccessBg: '#EAF4EE',
            colorSuccessBorder: '#C9DFD5',
            colorWarningBg: '#FDF4E8',
            colorWarningBorder: '#F1D6B4',
            colorErrorBg: '#FBEEED',
            colorErrorBorder: '#F0CCC9',
            colorInfoBg: '#EDF3FA',
            colorInfoBorder: '#C9DBEF',

            /* Texte */
            colorText: INK,
            colorTextHeading: INK,
            colorTextSecondary: INK_2,
            colorTextTertiary: INK_3,
            colorTextDescription: INK_2,
            colorTextPlaceholder: '#7D8F8A',

            /* Surfaces */
            colorBgLayout: SURFACE_SUNKEN,
            colorBgContainer: '#FFFFFF',
            colorFillAlter: '#F6F8F7',
            colorFillSecondary: '#EEF3F1',
            controlItemBgActive: BRAND_SUBTLE,
            controlItemBgHover: '#F1F5F3',

            /* Bordures & rayons */
            colorBorder: LINE_STRONG,
            colorBorderSecondary: LINE,
            colorSplit: LINE,
            borderRadius: 8,
            borderRadiusLG: 12,
            borderRadiusSM: 6,
            borderRadiusXS: 4,

            /* Typographie */
            fontFamily:
              'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontFamilyCode: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 14,
            fontSizeLG: 16,
            fontSizeXL: 20,
            fontSizeHeading1: 30,
            fontSizeHeading2: 24,
            fontSizeHeading3: 20,
            fontSizeHeading4: 16,
            fontSizeHeading5: 14,
            fontWeightStrong: 600,
            lineHeight: 1.5715,

            /* Contrôles */
            controlHeight: 36,
            controlHeightLG: 42,
            controlHeightSM: 28,
            controlOutline: 'rgba(15, 110, 82, 0.16)',
            controlOutlineWidth: 3,

            /* Élévation — sobre, décalée, jamais en halo */
            boxShadow: '0 1px 2px rgba(18, 56, 50, 0.06), 0 1px 3px rgba(18, 56, 50, 0.04)',
            boxShadowSecondary:
              '0 12px 32px -8px rgba(18, 56, 50, 0.18), 0 4px 10px -4px rgba(18, 56, 50, 0.08)',
            boxShadowTertiary: '0 1px 2px rgba(18, 56, 50, 0.05)',

            /* Mouvement */
            motionDurationSlow: '0.24s',
            motionDurationMid: '0.18s',
            motionDurationFast: '0.12s',
            motionEaseOut: 'cubic-bezier(0.16, 1, 0.3, 1)',

            /* Espacement */
            padding: 16,
            paddingLG: 24,
            margin: 16,
            marginLG: 24,
          },
          components: {
            Card: {
              headerFontSize: 15,
              headerHeight: 52,
              boxShadowTertiary: 'none',
            },
            Table: {
              headerBg: '#F6F8F7',
              headerColor: INK_2,
              headerSplitColor: 'transparent',
              rowHoverBg: '#F3F7F5',
              rowSelectedBg: BRAND_SUBTLE,
              rowSelectedHoverBg: '#DFEDE7',
              borderColor: LINE,
              cellPaddingBlock: 12,
              cellPaddingInline: 14,
              cellPaddingBlockMD: 10,
              cellPaddingBlockSM: 8,
              footerBg: '#F6F8F7',
            },
            Menu: {
              itemBorderRadius: 8,
              itemHeight: 38,
              itemMarginInline: 8,
              subMenuItemBg: 'transparent',
              itemSelectedBg: BRAND_SUBTLE,
              itemSelectedColor: BRAND_GREEN,
              itemHoverBg: '#F1F5F3',
              itemColor: INK_2,
              groupTitleColor: INK_3,
              iconSize: 16,
            },
            Tabs: {
              itemColor: INK_2,
              itemSelectedColor: INK,
              itemHoverColor: INK,
              inkBarColor: BRAND_GREEN,
              titleFontSize: 14,
              horizontalItemPadding: '12px 2px',
              horizontalItemGutter: 24,
            },
            Tag: {
              borderRadiusSM: 6,
              defaultBg: '#F1F5F3',
              defaultColor: INK_2,
            },
            Button: {
              borderRadius: 8,
              fontWeight: 500,
              primaryShadow: '0 1px 2px rgba(15, 110, 82, 0.24)',
              defaultShadow: '0 1px 2px rgba(18, 56, 50, 0.05)',
              dangerShadow: 'none',
              defaultBorderColor: LINE_STRONG,
            },
            Input: { borderRadius: 8, activeShadow: '0 0 0 3px rgba(15, 110, 82, 0.14)' },
            InputNumber: { activeShadow: '0 0 0 3px rgba(15, 110, 82, 0.14)' },
            Select: { borderRadius: 8, optionSelectedBg: BRAND_SUBTLE, optionSelectedFontWeight: 600 },
            DatePicker: { borderRadius: 8, activeShadow: '0 0 0 3px rgba(15, 110, 82, 0.14)' },
            Form: { labelColor: INK, verticalLabelPadding: '0 0 6px', itemMarginBottom: 20 },
            Drawer: { borderRadiusLG: 0, footerPaddingBlock: 12, footerPaddingInline: 24 },
            Modal: { titleFontSize: 17, headerBg: '#FFFFFF', footerBg: '#FFFFFF' },
            Segmented: { itemSelectedBg: '#FFFFFF', trackBg: '#EEF3F1', itemColor: INK_2 },
            Progress: { remainingColor: '#EEF3F1', defaultColor: BRAND_GREEN },
            Badge: { colorBgContainer: '#FFFFFF' },
            Descriptions: { labelBg: '#F6F8F7', titleColor: INK, labelColor: INK_2 },
            Statistic: { titleFontSize: 13, contentFontSize: 26 },
            Tooltip: { colorBgSpotlight: INK },
            Steps: { iconSize: 28 },
            Alert: { withDescriptionPadding: '14px 16px' },
          },
        }}
      >
        <App>
          {children}
        </App>
      </ConfigProvider>
    </StyleProvider>
  );
}

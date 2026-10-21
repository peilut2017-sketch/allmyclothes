import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useFonts } from '../fonts';
import { Phone, Tap } from '../components/Phone';
import { ChildrenScreen, ClosetScreen, DetailScreen, FilterSheetView, FILTER_TAPS, ShoppingScreen, SwapScreen, chipCenter, CLOSET_LAYOUT, DETAIL_TAPS, SWAP_TAPS, CHILDREN_TAPS, TransferSheet, ConditionSheet } from '../app/screens';
import { CLOSET_ALL, itemById, SHOP_LIST, GAP_ROW } from '../app/data';

/** קומפוזיציית בדיקה: כל המסכים זה לצד זה, עם נקודות הלחיצה – לכיול מיקומים */
const Dot = ({ x, y }: { x: number; y: number }) => <div style={{ position: 'absolute', left: x - 6, top: y - 6, width: 12, height: 12, borderRadius: 9, background: 'red', zIndex: 300 }} />;

export const ScreensTest: React.FC = () => {
  useFonts();
  const screens: React.ReactNode[] = [
    <>
      <ClosetScreen ids={CLOSET_ALL} activeChild="shira" filterCount={2} />
      {[0, 1, 2].map((i) => <Dot key={i} {...chipCenter(i)} />)}
      <Dot {...CLOSET_LAYOUT.filterBtn} />
    </>,
    <>
      <ClosetScreen ids={CLOSET_ALL} />
      <FilterSheetView p={1} winter size56 />
      <Dot {...FILTER_TAPS.winter} />
      <Dot {...FILTER_TAPS.size} />
      <Dot {...FILTER_TAPS.show} />
    </>,
    <>
      <DetailScreen item={itemById('i1')} />
      <Dot {...DETAIL_TAPS.transfer} />
      <Dot {...DETAIL_TAPS.status} />
      <Dot {...DETAIL_TAPS.statusBadge} />
      <Dot {...DETAIL_TAPS.cond} />
    </>,
    <>
      <ChildrenScreen alertP={1} />
      <Dot {...CHILDREN_TAPS.row} />
    </>,
    <>
      <SwapScreen index={3} total={12} item={itemById('i3')} inP={1} />
      <Dot {...SWAP_TAPS.keep} />
      <Dot {...SWAP_TAPS.transfer} />
      <Dot {...SWAP_TAPS.outgrown} />
    </>,
    <>
      <ShoppingScreen rows={[GAP_ROW, ...SHOP_LIST]} gapsShown={['g1', 'g2']} />
    </>,
    <>
      <DetailScreen item={itemById('i3')} />
      <TransferSheet p={1} exclude="yehuda" />
    </>,
    <>
      <SwapScreen index={0} total={12} item={itemById('i3')} inP={1} />
      <ConditionSheet p={1} value={8} sub="עוד לא דורג – לחיצה על מספר שומרת וממשיכה" />
    </>,
  ];
  return (
    <AbsoluteFill style={{ background: '#ddd' }}>
      {screens.map((s, i) => (
        <Phone key={i} pose={{ x: 230 + (i % 4) * 440, y: 470 + Math.floor(i / 4) * 900, s: 1 }} shadow={0.3}>
          {s}
          <Tap x={100} y={100} f={-100} />
        </Phone>
      ))}
    </AbsoluteFill>
  );
};

import { describe, it, expect } from 'vitest';
import {
  determineArchetype,
  encodeSimulationState,
  decodeSimulationState,
  decodeSimulationPayload,
  resolveCanonicalChapter,
  ARCHETYPES,
} from '@/engine/core/archetypes';
import {
  isSoundMuted,
  setSoundMuted,
  toggleSound,
  playCoinSound,
  playSoftClick,
  playSuccessChime,
  playTensionHum,
  stopTensionHum,
} from '@/engine/core/audio';

describe('Archetypes & State Encoding Engine (محرك الأنماط وتشفير الحالة)', () => {
  describe('Invariants 1: URL State Serialization & Deserialization Hardening', () => {
    it('accurately encodes and decodes numeric simulation state into query strings', () => {
      const state = {
        playerSheep: 3,
        pastureHealth: 72.5,
        totalGold: 140,
      };

      const query = encodeSimulationState('03-common-pasture', state);
      expect(query).toContain('ch=03-common-pasture');
      expect(query).toContain('playerSheep=3');
      expect(query).toContain('pastureHealth=72.5');

      const decoded = decodeSimulationState(query, '03-common-pasture');
      expect(decoded).not.toBeNull();
      expect(decoded?.playerSheep).toBe(3);
      expect(decoded?.pastureHealth).toBe(72.5);
      expect(decoded?.totalGold).toBe(140);
    });

    it('decodes full URLs and extracts both chapterId and state payload', () => {
      const fullUrl = 'https://innate-economics.pages.dev/chapters/3-common-pasture?ch=03-common-pasture&pastureHealth=80&playerSheep=2';
      const { chapterId, state } = decodeSimulationPayload(fullUrl);

      expect(chapterId).toBe('03-common-pasture');
      expect(state?.pastureHealth).toBe(80);
      expect(state?.playerSheep).toBe(2);
    });

    it('gracefully handles empty, invalid, and malicious inputs', () => {
      expect(decodeSimulationState('')).toBeNull();
      expect(decodeSimulationState('foo=bar')).toBeNull();

      // Guard against Number("Infinity"), "1e999", and Number("") -> 0
      expect(decodeSimulationState('ch=03-common-pasture&health=Infinity')).toBeNull();
      expect(decodeSimulationState('ch=03-common-pasture&health=1e999')).toBeNull();
      expect(decodeSimulationState('ch=03-common-pasture&health=')).toBeNull();
      expect(decodeSimulationState('ch=03-common-pasture&health=   ')).toBeNull();
      expect(decodeSimulationState('ch=03-common-pasture&health=NaN')).toBeNull();
    });

    it('whitelists keys and clamps numerical values to chapter bounds', () => {
      // In chapter 3: health min 0, max 100; playerSheep min 0, max 20
      const clamped = decodeSimulationState('ch=03-common-pasture&pastureHealth=9999&playerSheep=-5&unwantedKey=42');
      expect(clamped).not.toBeNull();
      expect(clamped?.pastureHealth).toBe(100); // clamped to 100
      expect(clamped?.playerSheep).toBe(0);    // clamped to 0
      expect(clamped?.unwantedKey).toBeUndefined(); // discarded unwhitelisted key
    });
  });

  describe('Invariants 2: Archetype Categorization & Dynamic Axis Scoring', () => {
    it('classifies pasture preservation into "cautious-guardian" with dynamic score', () => {
      const profile = determineArchetype('03-common-pasture', {
        playerSheep: 2,
        pastureHealth: 90,
      });
      expect(profile.id).toBe('cautious-guardian');
      expect(profile.name).toBe('حارس المشاع الحذر');
      expect(profile.balanceAxis.score).toBeGreaterThan(60);
    });

    it('classifies pasture overgrazing into "aggressive-extractor" (not high-liquidity-adventurer)', () => {
      const profile = determineArchetype('03-common-pasture', {
        playerSheep: 7,
        pastureHealth: 25,
      });
      expect(profile.id).toBe('aggressive-extractor');
      expect(profile.name).toBe('مستنزف المشاع الجائر');
      expect(profile.balanceAxis.score).toBeLessThan(30);
    });

    it('classifies Chapter 2 (bread and gold) ovens vs gold inflation accurately', () => {
      // Investing in ovens -> patient-builder
      const profileOvens = determineArchetype('02-bread-and-gold', {
        ovensCount: 4,
        goldSupply: 20,
      });
      expect(profileOvens.id).toBe('patient-builder');
      expect(profileOvens.balanceAxis.score).toBeGreaterThan(70);

      // Excessive gold injection without production -> high-liquidity-adventurer
      const profileInflation = determineArchetype('02-bread-and-gold', {
        goldSupply: 100,
        ovensCount: 1,
      });
      expect(profileInflation.id).toBe('high-liquidity-adventurer');
    });

    it('classifies Chapter 5 (bank run / whisper) reserve strategies accurately', () => {
      // High reserves (50%) -> cautious-guardian
      const profileCautious = determineArchetype('05-whisper-in-the-market', {
        reserveRatio: 0.50,
      });
      expect(profileCautious.id).toBe('cautious-guardian');
      expect(profileCautious.balanceAxis.score).toBe(50);

      // Fragile overleveraged reserves (8%) -> high-liquidity-adventurer
      const profileGamble = determineArchetype('05-whisper-in-the-market', {
        reserveRatio: 0.08,
      });
      expect(profileGamble.id).toBe('high-liquidity-adventurer');
      expect(profileGamble.balanceAxis.score).toBe(8);
    });

    it('classifies heavy tool investment into "patient-builder" with dynamic score reflecting tool hours', () => {
      const profileLow = determineArchetype('01-time-budget', {
        toolHours: 6,
        workHours: 5,
        restHours: 5,
      });
      const profileHigh = determineArchetype('01-time-budget', {
        toolHours: 10,
        workHours: 2,
        restHours: 4,
      });
      expect(profileLow.id).toBe('patient-builder');
      expect(profileHigh.id).toBe('patient-builder');
      expect(profileHigh.balanceAxis.score).toBeGreaterThan(profileLow.balanceAxis.score);
    });

    it('classifies cooperative price war behavior into "cautious-guardian"', () => {
      const profileCoop = determineArchetype('06-price-war', {
        cooperateCount: 8,
        undercutCount: 1,
        averagePrice: 9.5,
      });
      expect(profileCoop.id).toBe('cautious-guardian');

      const profileAggressive = determineArchetype('06-price-war', {
        cooperateCount: 1,
        undercutCount: 8,
        averagePrice: 5.5,
      });
      expect(profileAggressive.id).toBe('high-liquidity-adventurer');
    });

    it('resolves chapter IDs using exact canonical mapping', () => {
      expect(resolveCanonicalChapter('01-currency-of-life')).toBe('ch1-time-budget');
      expect(resolveCanonicalChapter('02-bread-and-gold')).toBe('ch2-bread-and-gold');
      expect(resolveCanonicalChapter('03-common-pasture')).toBe('ch3-common-pasture');
      expect(resolveCanonicalChapter('04-borrowing-tomorrow')).toBe('ch4-borrowing-tomorrow');
      expect(resolveCanonicalChapter('05-whisper-in-the-market')).toBe('ch5-whisper-market');
      expect(resolveCanonicalChapter('06-price-war')).toBe('ch6-price-war');
      expect(resolveCanonicalChapter('unknown-chapter')).toBeNull();
    });
  });
});

describe('Innate Audio Engine SSR/Browser Safety', () => {
  it('audio methods execute safely without throwing errors in Node environment', () => {
    expect(() => {
      playCoinSound();
      playSoftClick();
      playSuccessChime();
      playTensionHum(0.8);
      stopTensionHum();
    }).not.toThrow();
  });
});

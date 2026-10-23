import { describe, it, expect } from 'vitest';
import {
  determineArchetype,
  encodeSimulationState,
  decodeSimulationState,
  decodeSimulationPayload,
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
  describe('Invariants 1: URL State Serialization & Deserialization', () => {
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

      const decoded = decodeSimulationState(query);
      expect(decoded).not.toBeNull();
      expect(decoded?.playerSheep).toBe(3);
      expect(decoded?.pastureHealth).toBe(72.5);
      expect(decoded?.totalGold).toBe(140);
    });

    it('decodes full URLs and extracts both chapterId and state payload', () => {
      const fullUrl = 'https://innate-economics.pages.dev/chapters/3-common-pasture?ch=03-pasture&health=80&sheep=2';
      const { chapterId, state } = decodeSimulationPayload(fullUrl);

      expect(chapterId).toBe('03-pasture');
      expect(state?.health).toBe(80);
      expect(state?.sheep).toBe(2);
    });

    it('gracefully handles empty or invalid query strings', () => {
      expect(decodeSimulationState('')).toBeNull();
      expect(decodeSimulationState('foo=bar')).toBeNull();
    });
  });

  describe('Invariants 2: Archetype Categorization', () => {
    it('classifies pasture preservation into "cautious-guardian"', () => {
      const profile = determineArchetype('03-common-pasture', {
        playerSheep: 2,
        pastureHealth: 90,
      });
      expect(profile.id).toBe('cautious-guardian');
      expect(profile.name).toBe('حارس المشاع الحذر');
    });

    it('classifies pasture overgrazing into "high-liquidity-adventurer"', () => {
      const profile = determineArchetype('03-common-pasture', {
        playerSheep: 7,
        pastureHealth: 25,
      });
      expect(profile.id).toBe('high-liquidity-adventurer');
      expect(profile.name).toBe('مغامر السيولة العالية');
    });

    it('classifies heavy tool investment into "patient-builder"', () => {
      const profile = determineArchetype('01-time-budget', {
        toolHours: 8,
        workHours: 4,
        toolTier: 2,
      });
      expect(profile.id).toBe('patient-builder');
      expect(profile.name).toBe('بنّاء الأصول طويل النَفَس');
    });

    it('classifies cooperative price war behavior into "cautious-guardian" or "dynamic-balancer"', () => {
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

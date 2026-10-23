import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { playCoinSound, playSoftClick } from '../../engine/core/audio';
import { Coins, Plus, RotateCcw, Sparkles } from 'lucide-react';

export interface PhysicsCoinVaultProps {
  initialCoins?: number;
  maxCoins?: number;
  label?: string;
}

export function PhysicsCoinVault({
  initialCoins = 12,
  maxCoins = 120,
  label = 'خزينة الذهب الفيزيائية (Matter.js 2D Physics)',
}: PhysicsCoinVaultProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const [coinsCount, setCoinsCount] = useState(initialCoins);
  const lastSoundTimeRef = useRef<number>(0);

  // Function to spawn a physical coin
  const spawnCoin = useCallback((x?: number, y?: number) => {
    if (!engineRef.current) return;
    const { Bodies, Composite } = Matter;

    const spawnX = x ?? 60 + Math.random() * 200;
    const spawnY = y ?? 20 + Math.random() * 30;
    const radius = 10 + Math.random() * 3;

    const coin = Bodies.circle(spawnX, spawnY, radius, {
      restitution: 0.45, // Bouncy elasticity
      friction: 0.15,
      density: 0.002,
      render: {
        fillStyle: Math.random() > 0.3 ? '#f59e0b' : '#fbbf24',
        strokeStyle: '#d97706',
        lineWidth: 1.5,
      },
    });

    Composite.add(engineRef.current.world, coin);
    setCoinsCount((prev) => Math.min(maxCoins, prev + 1));

    // Throttled tactile sound
    const now = Date.now();
    if (now - lastSoundTimeRef.current > 90) {
      lastSoundTimeRef.current = now;
      playCoinSound();
    }
  }, [maxCoins]);

  // Reset vault
  const handleReset = useCallback(() => {
    if (!engineRef.current) return;
    const { Composite } = Matter;
    const allBodies = Composite.allBodies(engineRef.current.world);
    // Remove all circles (coins), keep walls (rectangles)
    allBodies.forEach((body) => {
      if (body.circleRadius) {
        Composite.remove(engineRef.current!.world, body);
      }
    });
    setCoinsCount(0);
    playSoftClick();

    // Spawn initial batch
    for (let i = 0; i < initialCoins; i++) {
      setTimeout(() => spawnCoin(), i * 60);
    }
  }, [initialCoins, spawnCoin]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

    // 1. Create Engine
    const engine = Engine.create({
      gravity: { x: 0, y: 1.2 },
    });
    engineRef.current = engine;

    const width = sceneRef.current.clientWidth || 320;
    const height = 240;

    // 2. Create Renderer
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#060911',
      },
    });
    renderRef.current = render;

    // 3. Create Container Boundaries (Floor, Left Wall, Right Wall)
    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      render: { fillStyle: 'rgba(30, 41, 59, 0.7)' },
    };

    const floor = Bodies.rectangle(width / 2, height + 10, width, 30, wallOptions);
    const leftWall = Bodies.rectangle(-10, height / 2, 30, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 10, height / 2, 30, height, wallOptions);

    Composite.add(engine.world, [floor, leftWall, rightWall]);

    // Collision sound events
    Events.on(engine, 'collisionStart', () => {
      const now = Date.now();
      if (now - lastSoundTimeRef.current > 120) {
        lastSoundTimeRef.current = now;
        playCoinSound();
      }
    });

    // 4. Run Engine & Render
    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Initial coins batch
    for (let i = 0; i < initialCoins; i++) {
      setTimeout(() => {
        if (engineRef.current) {
          spawnCoin();
        }
      }, i * 40);
    }

    // Cleanup
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, []);

  return (
    <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
            {coinsCount} قطعة نقدية
          </span>

          <button
            onClick={() => spawnCoin()}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer"
            title="سك قطعة ذهبية وسقوطها فيزيائياً"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="إفراغ الخزينة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Physics Canvas Container */}
      <div
        ref={sceneRef}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          spawnCoin(e.clientX - rect.left, e.clientY - rect.top);
        }}
        className="w-full h-[240px] rounded-xl overflow-hidden border border-slate-800 relative cursor-crosshair shadow-inner"
      />

      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>انقر في أي مكان داخل الخزينة لإسقاط عملات إضافية</span>
        <span className="font-mono">Matter.js Physics 2D</span>
      </div>
    </div>
  );
}

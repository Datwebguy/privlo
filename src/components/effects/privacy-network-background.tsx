import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

type Shard = {
  angle: number;
  radiusX: number;
  radiusY: number;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  depth: number;
  sides: number;
};

type Dust = {
  x: number;
  y: number;
  size: number;
  phase: number;
  drift: number;
  teal: boolean;
};

export function PrivacyNetworkBackground({
  className,
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let resizeFrame = 0;
    let previousTime = 0;
    let scrollTarget = window.scrollY;
    let scrollCurrent = scrollTarget;
    let visible = !document.hidden;
    let shards: Shard[] = [];
    let dust: Dust[] = [];

    const createScene = () => {
      const mobile = width < 720;
      const shardCount = mobile ? 18 : Math.min(58, Math.round(width / 27));
      const dustCount = mobile ? 28 : Math.min(78, Math.round(width / 18));

      shards = Array.from({ length: shardCount }, (_, index) => {
        const depth = 0.25 + Math.random() * 0.75;
        return {
          angle: (index / shardCount) * Math.PI * 2 + Math.random() * 0.38,
          radiusX: width * (0.08 + Math.random() * 0.25),
          radiusY: height * (0.07 + Math.random() * 0.28),
          size: (1.8 + Math.random() * 7) * depth,
          speed: (0.000012 + Math.random() * 0.000026) * (index % 2 ? 1 : -1),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.00011,
          depth,
          sides: 3 + Math.floor(Math.random() * 3),
        };
      }).sort((left, right) => left.depth - right.depth);

      dust = Array.from({ length: dustCount }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: index % 17 === 0 ? 2.2 + Math.random() * 1.6 : 0.35 + Math.random(),
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.008,
        teal: index % 17 === 0,
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.65);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      createScene();
    };

    const polygon = (
      x: number,
      y: number,
      radius: number,
      sides: number,
      rotation: number,
    ) => {
      context.beginPath();
      for (let side = 0; side < sides; side += 1) {
        const angle = rotation + (side / sides) * Math.PI * 2;
        const variance = 0.76 + ((side * 13) % 5) * 0.08;
        const pointX = x + Math.cos(angle) * radius * variance;
        const pointY = y + Math.sin(angle) * radius * variance;
        if (side === 0) context.moveTo(pointX, pointY);
        else context.lineTo(pointX, pointY);
      }
      context.closePath();
    };

    const drawCore = (x: number, y: number, time: number) => {
      const radius = Math.max(32, Math.min(62, width * 0.041));
      const breathe = 1 + Math.sin(time * 0.00045) * 0.035;
      const glow = context.createRadialGradient(x, y, 2, x, y, radius * 2.45);
      glow.addColorStop(0, "rgba(87, 255, 222, .15)");
      glow.addColorStop(0.35, "rgba(22, 172, 168, .07)");
      glow.addColorStop(1, "rgba(4, 16, 20, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, radius * 2.45, 0, Math.PI * 2);
      context.fill();

      context.save();
      context.shadowBlur = 22;
      context.shadowColor = "rgba(63, 244, 214, .22)";
      polygon(x, y, radius * breathe, 9, time * 0.000035);
      const body = context.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.35,
        2,
        x,
        y,
        radius,
      );
      body.addColorStop(0, "rgba(66, 79, 91, .72)");
      body.addColorStop(0.52, "rgba(22, 29, 37, .92)");
      body.addColorStop(1, "rgba(6, 10, 14, .96)");
      context.fillStyle = body;
      context.fill();
      context.strokeStyle = "rgba(111, 134, 149, .22)";
      context.lineWidth = 0.7;
      context.stroke();
      context.restore();

      const fissures = [
        [-0.55, -0.18, -0.18, -0.42],
        [-0.17, -0.42, 0.08, -0.12],
        [0.08, -0.12, 0.47, -0.27],
        [-0.36, 0.2, -0.03, 0.08],
        [-0.03, 0.08, 0.28, 0.4],
        [0.28, 0.4, 0.53, 0.14],
      ];
      context.save();
      context.translate(x, y);
      context.rotate(time * 0.000035);
      context.shadowBlur = 9;
      context.shadowColor = "rgba(75, 255, 225, .55)";
      context.strokeStyle = "rgba(77, 247, 218, .56)";
      context.lineWidth = Math.max(1, radius * 0.035);
      for (const [x1, y1, x2, y2] of fissures) {
        context.beginPath();
        context.moveTo(x1 * radius, y1 * radius);
        context.lineTo(x2 * radius, y2 * radius);
        context.stroke();
      }
      context.restore();

      context.fillStyle = "rgba(163, 255, 237, .72)";
      context.beginPath();
      context.arc(x + radius * 0.12, y - radius * 0.04, radius * 0.07, 0, Math.PI * 2);
      context.fill();
    };

    const draw = (time: number) => {
      const delta = previousTime ? Math.min(time - previousTime, 34) : 16;
      previousTime = time;
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.025;
      context.clearRect(0, 0, width, height);

      const mobile = width < 720;
      const coreX = mobile ? width * 0.78 : width * 0.73;
      const coreY =
        height * (mobile ? 0.29 : 0.38) -
        (scrollCurrent % (height * 3)) * 0.012;

      dust.forEach((particle) => {
        particle.y += reduceMotion ? 0 : particle.drift * delta;
        if (particle.y < -4) particle.y = height + 4;
        if (particle.y > height + 4) particle.y = -4;
        const pulse = 0.55 + Math.sin(time * 0.00055 + particle.phase) * 0.35;
        context.fillStyle = particle.teal
          ? `rgba(50, 235, 211, ${0.28 * pulse})`
          : `rgba(159, 177, 193, ${0.12 * pulse})`;
        if (particle.teal) {
          context.shadowBlur = 10;
          context.shadowColor = "rgba(51, 245, 216, .4)";
        }
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });

      shards.forEach((shard) => {
        if (!reduceMotion) {
          shard.angle += shard.speed * delta;
          shard.rotation += shard.rotationSpeed * delta;
        }
        const perspective = 0.68 + Math.sin(shard.angle * 1.7) * 0.32;
        const x = coreX + Math.cos(shard.angle) * shard.radiusX;
        const y =
          coreY +
          Math.sin(shard.angle) * shard.radiusY * (0.55 + shard.depth * 0.45);
        const size = shard.size * (0.55 + perspective * 0.7);
        polygon(x, y, size, shard.sides, shard.rotation);
        const shade = 39 + Math.round(shard.depth * 45);
        context.fillStyle = `rgba(${shade}, ${shade + 7}, ${shade + 17}, ${0.13 + shard.depth * 0.2})`;
        context.fill();
        context.strokeStyle = `rgba(126, 145, 162, ${0.035 + shard.depth * 0.07})`;
        context.lineWidth = 0.45;
        context.stroke();
      });

      drawCore(coreX, coreY, time);

      if (visible && !reduceMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handleVisibility = () => {
      visible = !document.hidden;
      if (visible && !reduceMotion) {
        previousTime = 0;
        animationFrame = window.requestAnimationFrame(draw);
      } else {
        window.cancelAnimationFrame(animationFrame);
      }
    };
    const handleScroll = () => {
      scrollTarget = window.scrollY;
    };
    const handleResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    };

    resize();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("privacy-network-background", className)}
    >
      <div className="cosmic-nebula cosmic-nebula-left" />
      <div className="cosmic-nebula cosmic-nebula-right" />
      <div className="cosmic-light-beam" />
      <canvas ref={canvasRef} />
      <div className="privacy-network-vignette" />
    </div>
  );
}

import * as THREE from 'three';

const DAMPING = 0.06; // 稍微增加阻力
const DRAG = 1 - DAMPING;
const MASS = 0.1;
const GRAVITY = new THREE.Vector3(0, -1.2, 0); // 进一步降低重力，让掉落更轻柔
const TIMESTEP = 18 / 1000;
const TIMESTEP_SQ = TIMESTEP * TIMESTEP;

export class Particle {
  position: THREE.Vector3;
  previous: THREE.Vector3;
  original: THREE.Vector3;
  a: THREE.Vector3; // acceleration
  mass: number;
  invMass: number;
  tmp: THREE.Vector3;
  tmp2: THREE.Vector3;

  constructor(x: number, y: number, z: number, mass: number) {
    this.position = new THREE.Vector3(x, y, z);
    this.previous = new THREE.Vector3(x, y, z);
    this.original = new THREE.Vector3(x, y, z);
    this.a = new THREE.Vector3(0, 0, 0);
    this.mass = mass;
    this.invMass = 1 / mass;
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
  }

  addForce(force: THREE.Vector3) {
    this.a.add(this.tmp2.copy(force).multiplyScalar(this.invMass));
  }

  integrate() {
    const newPos = this.tmp.subVectors(this.position, this.previous);
    newPos.multiplyScalar(DRAG).add(this.position);
    newPos.add(this.a.multiplyScalar(TIMESTEP_SQ));

    this.tmp = this.previous;
    this.previous = this.position;
    this.position = newPos;

    this.a.set(0, 0, 0);
  }
}

export class Cloth {
  w: number;
  h: number;
  particles: Particle[];
  constraints: [Particle, Particle, number][];

  constructor(xSegs: number, ySegs: number, restDistance: number) {
    this.w = xSegs;
    this.h = ySegs;
    this.particles = [];
    this.constraints = [];

    // Create particles
    for (let v = 0; v <= ySegs; v++) {
      for (let u = 0; u <= xSegs; u++) {
        const x = (u / xSegs - 0.5) * xSegs * restDistance;
        // 起始高度降低一点点，避免等太久，但仍然有足够下落空间
        const y = 3.2; 
        const z = (v / ySegs - 0.5) * ySegs * restDistance;
        this.particles.push(new Particle(x, y, z, MASS));
      }
    }

    // Create constraints
    const index = (u: number, v: number) => u + v * (xSegs + 1);

    for (let v = 0; v < ySegs; v++) {
      for (let u = 0; u < xSegs; u++) {
        this.constraints.push([
          this.particles[index(u, v)],
          this.particles[index(u, v + 1)],
          restDistance
        ]);
        this.constraints.push([
          this.particles[index(u, v)],
          this.particles[index(u + 1, v)],
          restDistance
        ]);
      }
    }

    for (let u = xSegs, v = 0; v < ySegs; v++) {
      this.constraints.push([
        this.particles[index(u, v)],
        this.particles[index(u, v + 1)],
        restDistance
      ]);
    }

    for (let v = ySegs, u = 0; u < xSegs; u++) {
      this.constraints.push([
        this.particles[index(u, v)],
        this.particles[index(u + 1, v)],
        restDistance
      ]);
    }

    // Shear constraints
    const diagonalDist = Math.sqrt(restDistance * restDistance * 2);
    for (let v = 0; v < ySegs; v++) {
      for (let u = 0; u < xSegs; u++) {
        this.constraints.push([
          this.particles[index(u, v)],
          this.particles[index(u + 1, v + 1)],
          diagonalDist
        ]);
        this.constraints.push([
          this.particles[index(u + 1, v)],
          this.particles[index(u, v + 1)],
          diagonalDist
        ]);
      }
    }
  }

  reset() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.position.copy(p.original);
      p.previous.copy(p.original);
      p.a.set(0, 0, 0);
    }
  }
}

let windTime = 0;

export function simulate(cloth: Cloth, geometry: THREE.BufferGeometry, sphereRadius: number) {
  windTime += TIMESTEP;
  
  // 优化风力：保证X和Z方向的风力非常微弱，避免把布料吹出球体外
  // 只保留Y方向（上下起伏）的波动和非常微小的水平扰动
  const windStrength = Math.cos(windTime / 2) * 0.8 + 0.5;
  const windForce = new THREE.Vector3(
    Math.sin(windTime) * windStrength * 0.1,  // 极小的X轴风
    Math.cos(windTime * 1.5) * windStrength * 0.6, // Y轴起伏让布料显得轻柔
    Math.sin(windTime * 1.2) * windStrength * 0.1  // 极小的Z轴风
  );

  for (let i = 0; i < cloth.particles.length; i++) {
    const p = cloth.particles[i];
    
    p.addForce(GRAVITY);
    
    // 如果布料还在空中，才施加风力
    if (p.position.y > sphereRadius + 0.2) {
      // 边缘风力稍大一点产生褶皱感
      const isEdge = i % cloth.w === 0 || i % cloth.w === cloth.w - 1 || i < cloth.w || i > cloth.particles.length - cloth.w;
      const localWind = windForce.clone().multiplyScalar(isEdge ? 1.2 : 0.8);
      
      // 增加一个向中心收拢的微弱力，确保布料一定落在球上
      const centerDir = new THREE.Vector3(0, p.position.y, 0).sub(p.position).normalize();
      localWind.add(centerDir.multiplyScalar(0.2));

      p.addForce(localWind);
    }
    
    p.integrate();
  }

  // Constraints resolution
  const diff = new THREE.Vector3();
  for (let i = 0; i < 7; i++) { 
    for (let j = 0; j < cloth.constraints.length; j++) {
      const [p1, p2, restDistance] = cloth.constraints[j];
      diff.subVectors(p2.position, p1.position);
      const currentDist = diff.length();
      if (currentDist === 0) continue;
      const correction = diff.multiplyScalar(1 - restDistance / currentDist);
      const correctionHalf = correction.multiplyScalar(0.5);
      p1.position.add(correctionHalf);
      p2.position.sub(correctionHalf);
    }

    // Sphere collision
    for (let j = 0; j < cloth.particles.length; j++) {
      const p = cloth.particles[j];
      const dist = p.position.length();
      const margin = 0.04; // 碰撞边界留白
      
      if (dist < sphereRadius + margin) { 
        // 将粒子沿法线推到球表面
        const normal = p.position.clone().normalize();
        p.position.copy(normal.multiplyScalar(sphereRadius + margin));
        
        // 极大的摩擦力：防止布料在球体上滑落
        const velocity = new THREE.Vector3().subVectors(p.position, p.previous);
        velocity.multiplyScalar(0.05); // 95% 动能被吸收，让布料牢牢“粘”在球上
        p.previous.copy(p.position).sub(velocity);
      }
      
      // Floor collision (地板砖高度在 -1.2 左右)
      if (p.position.y < -1.18) {
        p.position.y = -1.18;
        // 地板摩擦力
        const velocity = new THREE.Vector3().subVectors(p.position, p.previous);
        velocity.multiplyScalar(0.05);
        p.previous.copy(p.position).sub(velocity);
      }
    }
  }

  // Update geometry
  const posAttribute = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < cloth.particles.length; i++) {
    const p = cloth.particles[i].position;
    posAttribute.setXYZ(i, p.x, p.y, p.z);
  }
  posAttribute.needsUpdate = true;
  geometry.computeVertexNormals();
}

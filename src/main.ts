import "./style.css";
import { initGPU } from "./gpuContext";
import { createAdvectDensityPipeline } from "./pipelines/advect-density";
import { createAdvectVelocityPipeline } from "./pipelines/advect-velocity";
import { createDiffuseDensityPipeline } from "./pipelines/diffuse-density";
import { createDiffuseVelocityPipeline } from "./pipelines/diffuse-velocity";
import { createProjectVelocityPipeline } from "./pipelines/project-velocity";
import { createScalarBoundsPipeline } from "./pipelines/scalar-bounds";
import { createVectorBoundsPipeline } from "./pipelines/vector-bounds";
import { createSourcesPipeline } from "./pipelines/sources";
import { createRenderPipeline } from "./pipelines/render";
import { createBufferBindGroup } from "./bind-groups/buffer-group";
import { createInOutBindGroup } from "./bind-groups/in-out-group";
import { createSourcesBindGroup } from "./bind-groups/sources-group";
import { rasterizeLine } from "./pathRasterizer";
import { createCalcDivergencePipeline } from "./pipelines/calc-divergence";
import { createSolvePressurePipeline } from "./pipelines/solve-pressure";
import { createSimParamsBindGroup } from "./bind-groups/sim-params-group";
import { BooleanState } from "./BooleanState";

const gridX = 300;
const gridY = 300;
const groupSize = 16;

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
canvas.width = gridX;
canvas.height = gridY;

const { device, context, canvasFormat } = await initGPU(canvas);

//setup initial state
const gridSize = new Uint32Array([gridX, gridY]);
const vectorsGrid = new Float32Array(gridX * gridY * 2);
const scalarsGrid = new Float32Array(gridX * gridY);
const sources = new Uint32Array(10000 * 5);
const sourceCount = new Uint32Array([0]);
const dt = new Float32Array([0.0166666666]);
const viscosity = new Float32Array([5.0]);
const diffusivity = new Float32Array([2.0]);
const decay = new Float32Array([0.5]);

const gridSizeBuffer = device.createBuffer({
  size: gridSize.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const dtBuffer = device.createBuffer({
  size: dt.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const viscosityBuffer = device.createBuffer({
  size: viscosity.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const diffusivityBuffer = device.createBuffer({
  size: diffusivity.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const decayBuffer = device.createBuffer({
  size: decay.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const sourceCountBuffer = device.createBuffer({
  size: sourceCount.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const velState = new BooleanState();
const velocityBuffers = [
  device.createBuffer({
    label: "Velocity Field A",
    size: vectorsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Velocity Field B",
    size: vectorsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];

const densState = new BooleanState();
const densityBuffers = [
  device.createBuffer({
    label: "Density Field A",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Density Field B",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];

const pressState = new BooleanState();
const pressureBuffers = [
  device.createBuffer({
    label: "Pressure Field A",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Pressure Field B",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];

const divergenceBuffer = device.createBuffer({
  label: "Divergence Field",
  size: scalarsGrid.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

const sourcesBuffer = device.createBuffer({
  label: "Source Field",
  size: sources.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(gridSizeBuffer, 0, gridSize);
device.queue.writeBuffer(dtBuffer, 0, dt);
device.queue.writeBuffer(viscosityBuffer, 0, viscosity);
device.queue.writeBuffer(diffusivityBuffer, 0, diffusivity);
device.queue.writeBuffer(decayBuffer, 0, decay);

const simParamsBindGroup = createSimParamsBindGroup(
  device,
  gridSizeBuffer,
  dtBuffer,
  viscosityBuffer,
  diffusivityBuffer,
  decayBuffer
);
const sourceBindGroup = createSourcesBindGroup(
  device,
  sourceCountBuffer,
  sourcesBuffer
);
const velocityBindGroups = [
  createInOutBindGroup(device, velocityBuffers[0], velocityBuffers[1]),
  createInOutBindGroup(device, velocityBuffers[1], velocityBuffers[0]),
];
const singularVelocityBindGroups = [
  createBufferBindGroup(device, velocityBuffers[0]),
  createBufferBindGroup(device, velocityBuffers[1]),
];
const densityBindGroups = [
  createInOutBindGroup(device, densityBuffers[0], densityBuffers[1]),
  createInOutBindGroup(device, densityBuffers[1], densityBuffers[0]),
];
const singularDensityBindGroups = [
  createBufferBindGroup(device, densityBuffers[0]),
  createBufferBindGroup(device, densityBuffers[1]),
];
const pressureBindGroups = [
  createInOutBindGroup(device, pressureBuffers[0], pressureBuffers[1]),
  createInOutBindGroup(device, pressureBuffers[1], pressureBuffers[0]),
];
const singularPressureBindGroups = [
  createBufferBindGroup(device, pressureBuffers[0]),
  createBufferBindGroup(device, pressureBuffers[1]),
];
const divergenceBindGroup = createBufferBindGroup(device, divergenceBuffer);

const sourcePipeline = createSourcesPipeline(device);
const diffuseVelocityPipeline = createDiffuseVelocityPipeline(device);
const advectVelocityPipeline = createAdvectVelocityPipeline(device);
const calcDivergencePipeline = createCalcDivergencePipeline(device);
const solvePressurePipeline = createSolvePressurePipeline(device);
const projectVelocityPipeline = createProjectVelocityPipeline(device);
const diffuseDensityPipeline = createDiffuseDensityPipeline(device);
const advectDensityPipeline = createAdvectDensityPipeline(device);
const vectorBoundaryPipeline = createVectorBoundsPipeline(device);
const scalarBoundaryPipeline = createScalarBoundsPipeline(device);
const renderPipeline = createRenderPipeline(device, canvasFormat);

let lastPointer = { x: -1, y: -1 };
let currentPointer = { x: -1, y: -1 };
let isPointerActive = false;
canvas.style.touchAction = "none";

const pointerMoveEvent = (e: PointerEvent) => {
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  lastPointer = currentPointer;
  currentPointer = { x: mouseX, y: mouseY };
  isPointerActive = true;
};

canvas.addEventListener("pointerdown", (e) => {
  currentPointer = { x: e.offsetX, y: e.offsetY };
  canvas.setPointerCapture(e.pointerId); // Captures pointer during drag
  canvas.addEventListener("pointermove", pointerMoveEvent);
});

canvas.addEventListener("pointerup", (e) => {
  canvas.releasePointerCapture(e.pointerId);
  canvas.removeEventListener("pointermove", pointerMoveEvent);
});

const executeComputePass = (
  encoder: GPUCommandEncoder,
  pipeline: GPUComputePipeline,
  bindGroups: GPUBindGroup[],
  bufferStateToggles: BooleanState[],
  workgroupsX: number,
  workgroupsY: number
) => {
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  for (let i = 0; i < bindGroups.length; i++) {
    pass.setBindGroup(i, bindGroups[i]);
  }
  pass.dispatchWorkgroups(workgroupsX, workgroupsY);
  pass.end();
  for (const state of bufferStateToggles) {
    state.toggle();
  }
};

const executeRenderPass = (encoder: GPUCommandEncoder) => {
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      },
    ],
  });

  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, simParamsBindGroup);
  renderPass.setBindGroup(1, densityBindGroups[densState.val()]);
  renderPass.draw(3); // using fullscreen triangle
  renderPass.end();
};

const projectVelocities = (encoder: GPUCommandEncoder) => {
  executeComputePass(
    encoder,
    calcDivergencePipeline,
    [
      simParamsBindGroup,
      velocityBindGroups[velState.val()],
      divergenceBindGroup,
      singularPressureBindGroups[pressState.val()],
    ],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    [simParamsBindGroup, divergenceBindGroup],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    [simParamsBindGroup, singularPressureBindGroups[pressState.val()]],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  for (let i = 0; i < 20; i++) {
    executeComputePass(
      encoder,
      solvePressurePipeline,
      [
        simParamsBindGroup,
        divergenceBindGroup,
        pressureBindGroups[pressState.val()],
      ],
      [pressState],
      Math.ceil(gridX / groupSize),
      Math.ceil(gridY / groupSize)
    );

    executeComputePass(
      encoder,
      scalarBoundaryPipeline,
      [simParamsBindGroup, singularPressureBindGroups[pressState.val()]],
      [],
      Math.ceil(gridX / groupSize),
      Math.ceil(gridY / groupSize)
    );
  }

  executeComputePass(
    encoder,
    projectVelocityPipeline,
    [
      simParamsBindGroup,
      pressureBindGroups[pressState.val()],
      singularVelocityBindGroups[velState.val()],
    ],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    vectorBoundaryPipeline,
    [simParamsBindGroup, singularVelocityBindGroups[velState.val()]],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );
};

const simulationLoop = () => {
  const encoder = device.createCommandEncoder();
  if (isPointerActive) {
    const cellWidth = canvas.clientWidth / gridX;
    const cellHeight = canvas.clientHeight / gridY;
    const x0 = Math.floor(lastPointer.x / cellWidth);
    const y0 = Math.floor(lastPointer.y / cellHeight);
    const x1 = Math.floor(currentPointer.x / cellWidth);
    const y1 = Math.floor(currentPointer.y / cellHeight);
    const vx = (x1 - x0) / cellWidth / 0.016666; // default request animation frame timestep
    const vy = (y1 - y0) / cellHeight / 0.016666; // default request animation frame timestep
    const cells = rasterizeLine(x0, y0, x1, y1, 8);
    sourceCount[0] = cells.length;
    for (let i = 0; i < cells.length; i++) {
      sources[i * 6] = cells[i].x;
      sources[i * 6 + 1] = cells[i].y;
      // Trick: convert floats to raw bits for Float32s
      const densityBits = new Float32Array([1]).buffer;
      const velocityBits = new Float32Array([vx, vy]).buffer;

      const densityView = new Uint32Array(densityBits);
      const velocityView = new Uint32Array(velocityBits);
      sources[i * 6 + 2] = velocityView[0];
      sources[i * 6 + 3] = velocityView[1];
      sources[i * 6 + 4] = densityView[0];
      sources[i * 6 + 5] = 0;
    }
    device.queue.writeBuffer(sourceCountBuffer, 0, sourceCount);
    device.queue.writeBuffer(sourcesBuffer, 0, sources);
    const pass = encoder.beginComputePass();
    pass.setPipeline(sourcePipeline);
    pass.setBindGroup(0, simParamsBindGroup);
    pass.setBindGroup(1, sourceBindGroup);
    pass.setBindGroup(2, singularVelocityBindGroups[velState.val()]);
    pass.setBindGroup(3, singularDensityBindGroups[densState.val()]);
    pass.dispatchWorkgroups((gridX * gridY) / 256);
    pass.end();
    isPointerActive = false;
  }
  executeComputePass(
    encoder,
    diffuseVelocityPipeline,
    [simParamsBindGroup, velocityBindGroups[velState.val()]],
    [velState],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    vectorBoundaryPipeline,
    [simParamsBindGroup, singularVelocityBindGroups[velState.val()]],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  projectVelocities(encoder);

  executeComputePass(
    encoder,
    advectVelocityPipeline,
    [simParamsBindGroup, velocityBindGroups[velState.val()]],
    [velState],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    vectorBoundaryPipeline,
    [simParamsBindGroup, singularVelocityBindGroups[velState.val()]],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  projectVelocities(encoder);

  executeComputePass(
    encoder,
    diffuseDensityPipeline,
    [simParamsBindGroup, densityBindGroups[densState.val()]],
    [densState],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    [simParamsBindGroup, singularDensityBindGroups[densState.val()]],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    advectDensityPipeline,
    [
      simParamsBindGroup,
      velocityBindGroups[velState.val()],
      densityBindGroups[densState.val()],
    ],
    [densState],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    [simParamsBindGroup, singularDensityBindGroups[densState.val()]],
    [],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );
  executeRenderPass(encoder);
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(simulationLoop);
};

requestAnimationFrame(simulationLoop);

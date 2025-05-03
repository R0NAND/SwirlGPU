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
import { createCalcDivergenceBindGroup } from "./bind-groups/calc-divergence-group";
import { createInInOutBindGroup } from "./bind-groups/in-in-out-group";
import { createInOutBindGroup } from "./bind-groups/in-out-group";
import { createProjectVelocityBindGroup } from "./bind-groups/project-velocity-group";
import { createScalarBoundsBindGroup } from "./bind-groups/scalar-bounds-group";
import { createSolvePressureBindGroup } from "./bind-groups/solve-pressure-group";
import { createSourcesBindGroup } from "./bind-groups/sources-group";
import { createVectorBoundsBindGroup } from "./bind-groups/vector-bounds-group";
import { rasterizeLine } from "./pathRasterizer";
import { createCalcDivergencePipeline } from "./pipelines/calc-divergence";
import { createSolvePressurePipeline } from "./pipelines/solve-pressure";

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

const gridSizeBuffer = device.createBuffer({
  size: gridSize.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const sourceCountBuffer = device.createBuffer({
  size: sourceCount.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
const velocitiesBuffers = [
  device.createBuffer({
    label: "Velocities A",
    size: vectorsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Velocities B",
    size: vectorsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];
const densitiesBuffers = [
  device.createBuffer({
    label: "Densities A",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Densities B",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];
const pressuresBuffers = [
  device.createBuffer({
    label: "Pressures A",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Pressures B",
    size: scalarsGrid.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];
const divergenceBuffer = device.createBuffer({
  label: "Divergence",
  size: scalarsGrid.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
const sourcesBuffer = device.createBuffer({
  label: "Sources",
  size: sources.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(gridSizeBuffer, 0, gridSize);
device.queue.writeBuffer(sourceCountBuffer, 0, sourceCount);
device.queue.writeBuffer(velocitiesBuffers[0], 0, vectorsGrid);
device.queue.writeBuffer(densitiesBuffers[0], 0, scalarsGrid);
device.queue.writeBuffer(velocitiesBuffers[1], 0, vectorsGrid);
device.queue.writeBuffer(densitiesBuffers[1], 0, scalarsGrid);
device.queue.writeBuffer(sourcesBuffer, 0, sources);
device.queue.writeBuffer(pressuresBuffers[0], 0, scalarsGrid);
device.queue.writeBuffer(pressuresBuffers[1], 0, scalarsGrid);
device.queue.writeBuffer(divergenceBuffer, 0, scalarsGrid);

const sourceBindGroup = createSourcesBindGroup(
  device,
  gridSizeBuffer,
  sourceCountBuffer,
  sourcesBuffer,
  velocitiesBuffers[0],
  densitiesBuffers[0]
);

const velocityBindGroups = [
  createInOutBindGroup(
    device,
    gridSizeBuffer,
    velocitiesBuffers[0],
    velocitiesBuffers[1]
  ),
  createInOutBindGroup(
    device,
    gridSizeBuffer,
    velocitiesBuffers[1],
    velocitiesBuffers[0]
  ),
];

const setVelocityBndsBindGroups = [
  createVectorBoundsBindGroup(device, gridSizeBuffer, velocitiesBuffers[0]),
  createVectorBoundsBindGroup(device, gridSizeBuffer, velocitiesBuffers[1]),
];

const setDensityBndsBindGroups = [
  createScalarBoundsBindGroup(device, gridSizeBuffer, densitiesBuffers[0]),
  createScalarBoundsBindGroup(device, gridSizeBuffer, densitiesBuffers[1]),
];

const setPressureBndsBindGroups = [
  createScalarBoundsBindGroup(device, gridSizeBuffer, pressuresBuffers[0]),
  createScalarBoundsBindGroup(device, gridSizeBuffer, pressuresBuffers[1]),
];

const setDivergenceBndsBindGroup = createScalarBoundsBindGroup(
  device,
  gridSizeBuffer,
  divergenceBuffer
);

const diffuseDensitiesBindGroup = createInOutBindGroup(
  device,
  gridSizeBuffer,
  densitiesBuffers[0],
  densitiesBuffers[1]
);

const advectDensitiesBindGroup = createInInOutBindGroup(
  device,
  gridSizeBuffer,
  velocitiesBuffers[0],
  densitiesBuffers[1],
  densitiesBuffers[0]
);

const calcDivergenceBindGroups = [
  createCalcDivergenceBindGroup(
    device,
    gridSizeBuffer,
    velocitiesBuffers[0],
    divergenceBuffer,
    pressuresBuffers[0]
  ),
  createCalcDivergenceBindGroup(
    device,
    gridSizeBuffer,
    velocitiesBuffers[1],
    divergenceBuffer,
    pressuresBuffers[0]
  ),
];

const solvePressureBindGroups = [
  createSolvePressureBindGroup(
    device,
    gridSizeBuffer,
    divergenceBuffer,
    pressuresBuffers[0],
    pressuresBuffers[1]
  ),
  createSolvePressureBindGroup(
    device,
    gridSizeBuffer,
    divergenceBuffer,
    pressuresBuffers[1],
    pressuresBuffers[0]
  ),
];

const projectVelocitiesBindGroups = [
  createProjectVelocityBindGroup(
    device,
    gridSizeBuffer,
    pressuresBuffers[0],
    velocitiesBuffers[0]
  ),
  createProjectVelocityBindGroup(
    device,
    gridSizeBuffer,
    pressuresBuffers[0],
    velocitiesBuffers[1]
  ),
];

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
const renderBindGroup = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: { buffer: gridSizeBuffer }, // the `r32float` grayscale texture
    },
    {
      binding: 1,
      resource: {
        buffer: densitiesBuffers[1],
      },
    },
  ],
});

let lastPointer = { x: -1, y: -1 };
let currentPointer = { x: -1, y: -1 };
let isPointerActive = false;

canvas.addEventListener("pointerdown", (e) => {
  isPointerActive = true;
  currentPointer = { x: e.offsetX, y: e.offsetY };
  canvas.setPointerCapture(e.pointerId); // Captures pointer during drag
});

canvas.addEventListener("pointerup", (e) => {
  isPointerActive = false;
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (currentPointer.x < 0) return;

  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  lastPointer = currentPointer;
  currentPointer = { x: mouseX, y: mouseY };
});

const executeComputePass = (
  encoder: GPUCommandEncoder,
  pipeline: GPUComputePipeline,
  bindGroup: GPUBindGroup,
  workgroupsX: number,
  workgroupsY: number
) => {
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(workgroupsX, workgroupsY);
  pass.end();
};

const executeRenderPass = (encoder: GPUCommandEncoder) => {
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 1, g: 1, b: 1, a: 1 },
      },
    ],
  });

  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, renderBindGroup);
  renderPass.draw(3); // using fullscreen triangle
  renderPass.end();
};

const projectVelocities = (encoder: GPUCommandEncoder) => {
  executeComputePass(
    encoder,
    calcDivergencePipeline,
    calcDivergenceBindGroups[1],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    setDivergenceBndsBindGroup,
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    setPressureBndsBindGroups[0],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  for (let i = 0; i < 10; i++) {
    executeComputePass(
      encoder,
      solvePressurePipeline,
      solvePressureBindGroups[0],
      Math.ceil(gridX / groupSize),
      Math.ceil(gridY / groupSize)
    );

    executeComputePass(
      encoder,
      scalarBoundaryPipeline,
      setPressureBndsBindGroups[1],
      Math.ceil(gridX / groupSize),
      Math.ceil(gridY / groupSize)
    );

    executeComputePass(
      encoder,
      solvePressurePipeline,
      solvePressureBindGroups[1],
      Math.ceil(gridX / groupSize),
      Math.ceil(gridY / groupSize)
    );

    executeComputePass(
      encoder,
      scalarBoundaryPipeline,
      setPressureBndsBindGroups[0],
      Math.ceil(gridX / groupSize),
      Math.ceil(gridY / groupSize)
    );
  }

  executeComputePass(
    encoder,
    projectVelocityPipeline,
    projectVelocitiesBindGroups[1],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    vectorBoundaryPipeline,
    setVelocityBndsBindGroups[0],
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
    const sourcePass = encoder.beginComputePass();
    sourcePass.setPipeline(sourcePipeline);
    sourcePass.setBindGroup(0, sourceBindGroup);
    sourcePass.dispatchWorkgroups(Math.ceil(cells.length / 256));
    sourcePass.end();
  }
  executeComputePass(
    encoder,
    diffuseVelocityPipeline,
    velocityBindGroups[0],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    vectorBoundaryPipeline,
    setVelocityBndsBindGroups[1],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  projectVelocities(encoder);

  executeComputePass(
    encoder,
    advectVelocityPipeline,
    velocityBindGroups[1],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    vectorBoundaryPipeline,
    setVelocityBndsBindGroups[0],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  projectVelocities(encoder);

  executeComputePass(
    encoder,
    diffuseDensityPipeline,
    diffuseDensitiesBindGroup,
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    setDensityBndsBindGroups[1],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    advectDensityPipeline,
    advectDensitiesBindGroup,
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );

  executeComputePass(
    encoder,
    scalarBoundaryPipeline,
    setDensityBndsBindGroups[0],
    Math.ceil(gridX / groupSize),
    Math.ceil(gridY / groupSize)
  );
  executeRenderPass(encoder);
  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(simulationLoop);
};

requestAnimationFrame(simulationLoop);

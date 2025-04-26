import "./style.css";
import sourceShader from "./source-shader.wgsl";
import diffusionShader from "./diffusion-shader.wgsl";
import advectionShader from "./advection-shader.wgsl";
import boundaryShader from "./boundary-shader.wgsl";
import vertexOverlayShader from "./vertex-overlay.wgsl";
import renderShader from "./renderer.wgsl";
//@ts-ignore
import Bresenham from "bresenham";

const gridX = 100;
const gridY = 100;

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
canvas.width = gridX;
canvas.height = gridY;
canvas.style.height = "90%";
canvas.style.border = "1px solid green";

if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();

const context = canvas.getContext("webgpu");
if (!context) {
  throw new Error(
    "Failed to resolve context from: 'canvas.getContext('webgpu');'."
  );
}
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device: device,
  format: canvasFormat,
});

const renderPipeline = device.createRenderPipeline({
  layout: "auto",
  vertex: {
    module: device.createShaderModule({ code: vertexOverlayShader }), // from vs_main
    entryPoint: "vs_main",
  },
  fragment: {
    module: device.createShaderModule({ code: renderShader }), // from your grayscale fragment shader
    entryPoint: "main",
    targets: [
      {
        format: canvasFormat,
      },
    ],
  },
});

//setup initial state
const gridSize = new Uint32Array([gridX, gridY]);
const velocities = new Float32Array(gridX * gridY * 2);
const densities = new Float32Array(gridX * gridY);
const sources = new Uint32Array(30 * 5);
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
    size: velocities.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Velocities B",
    size: velocities.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];
const densitiesBuffers = [
  device.createBuffer({
    label: "Densities A",
    size: densities.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
  device.createBuffer({
    label: "Densities B",
    size: densities.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  }),
];
const sourcesBuffer = device.createBuffer({
  label: "Sources",
  size: sources.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(gridSizeBuffer, 0, gridSize);
device.queue.writeBuffer(sourceCountBuffer, 0, sourceCount);
device.queue.writeBuffer(velocitiesBuffers[0], 0, velocities);
device.queue.writeBuffer(densitiesBuffers[0], 0, densities);
device.queue.writeBuffer(velocitiesBuffers[1], 0, velocities);
device.queue.writeBuffer(densitiesBuffers[1], 0, densities);
device.queue.writeBuffer(sourcesBuffer, 0, sources);

const sourceShaderModule = device.createShaderModule({
  label: "sourceShader",
  code: sourceShader,
});
const diffusionShaderModule = device.createShaderModule({
  label: "diffusionShader",
  code: diffusionShader,
});
const advectionShaderModule = device.createShaderModule({
  label: "advectionShader",
  code: advectionShader,
});
const boundaryShaderModule = device.createShaderModule({
  label: "boundaryShader",
  code: boundaryShader,
});

const sourceBindGroupLayout = device.createBindGroupLayout({
  label: "sourceBindGroupLayout",
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    },
    {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      binding: 3,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
    {
      binding: 4,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

const bindGroupLayout = device.createBindGroupLayout({
  label: "mainBindGroupLayout",
  entries: [
    {
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {},
    },
    {
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      binding: 3,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
    {
      binding: 4,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

const sourceBindGroup = device.createBindGroup({
  label: "sourceBindGroup",
  layout: sourceBindGroupLayout,
  entries: [
    {
      binding: 0,
      resource: {
        buffer: gridSizeBuffer,
      },
    },
    {
      binding: 1,
      resource: {
        buffer: sourceCountBuffer,
      },
    },
    {
      binding: 2,
      resource: {
        buffer: sourcesBuffer,
      },
    },
    {
      binding: 3,
      resource: {
        buffer: velocitiesBuffers[0],
      },
    },
    {
      binding: 4,
      resource: {
        buffer: densitiesBuffers[0],
      },
    },
  ],
});

const bindGroups = [
  device.createBindGroup({
    label: "bind group A",
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: gridSizeBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: velocitiesBuffers[0],
        },
      },
      {
        binding: 2,
        resource: {
          buffer: densitiesBuffers[0],
        },
      },
      {
        binding: 3,
        resource: {
          buffer: velocitiesBuffers[1],
        },
      },
      {
        binding: 4,
        resource: {
          buffer: densitiesBuffers[1],
        },
      },
    ],
  }),
  device.createBindGroup({
    label: "bind group B",
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: gridSizeBuffer,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: velocitiesBuffers[1],
        },
      },
      {
        binding: 2,
        resource: {
          buffer: densitiesBuffers[1],
        },
      },
      {
        binding: 3,
        resource: {
          buffer: velocitiesBuffers[0],
        },
      },
      {
        binding: 4,
        resource: {
          buffer: densitiesBuffers[0],
        },
      },
    ],
  }),
];

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

const sourcePipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [sourceBindGroupLayout],
  }),
  compute: {
    module: sourceShaderModule,
    entryPoint: "computeMain",
  },
});
const diffusionPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  }),
  compute: {
    module: diffusionShaderModule,
    entryPoint: "computeMain",
  },
});
const advectionPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  }),
  compute: {
    module: advectionShaderModule,
    entryPoint: "computeMain",
  },
});
const boundaryPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  }),
  compute: {
    module: boundaryShaderModule,
    entryPoint: "computeMain",
  },
});

let lastPointer = { x: -1, y: -1 };
let currentPointer = { x: -1, y: -1 };

canvas.addEventListener("pointerdown", (e) => {
  currentPointer = { x: e.offsetX, y: e.offsetY };
  canvas.setPointerCapture(e.pointerId); // Captures pointer during drag
});

canvas.addEventListener("pointerup", (e) => {
  lastPointer = { x: -1, y: -1 };
  currentPointer = { x: -1, y: -1 };
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (currentPointer.x < 0) return;

  const mouseX = e.offsetX;
  const mouseY = e.offsetY;

  lastPointer = currentPointer;
  currentPointer = { x: mouseX, y: mouseY };
});
let pingPongState = true;
const simulationLoop = () => {
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();

  if (lastPointer.x > 0) {
    const cellWidth = canvas.clientWidth / gridX;
    const cellHeight = canvas.clientHeight / gridY;
    const x0 = Math.floor(lastPointer.x / cellWidth);
    const y0 = Math.floor(lastPointer.y / cellHeight);
    const x1 = Math.floor(currentPointer.x / cellWidth);
    const y1 = Math.floor(currentPointer.y / cellHeight);
    const vx =
      (currentPointer.x - lastPointer.x) / cellWidth / 0.016666666666667;
    const vy =
      (currentPointer.y - lastPointer.y) / cellHeight / 0.016666666666667;
    //@ts-ignore
    const cells = Bresenham(x0, y0, x1, y1);
    sourceCount[0] = cells.length;
    for (let i = 0; i < cells.length; i++) {
      sources[i * 6] = cells[i].x;
      sources[i * 6 + 1] = cells[i].y;
      // Trick: convert floats to raw bits for Float32s
      const densityBits = new Float32Array([1.0]).buffer;
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
    pass.setPipeline(sourcePipeline);
    pass.setBindGroup(0, sourceBindGroup);
    pass.dispatchWorkgroups(Math.ceil(cells.length / 256));
  }
  pass.setPipeline(diffusionPipeline);
  pass.setBindGroup(0, bindGroups[0]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  //pingPongState = !pingPongState;
  pass.setPipeline(advectionPipeline);
  pass.setBindGroup(0, bindGroups[1]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  //pingPongState = !pingPongState;
  // pass.setPipeline(boundaryPipeline);
  // pass.setBindGroup(0, bindGroups[pingPongState ? 0 : 1]);
  // pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

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
  device.queue.submit([encoder.finish()]);
  // pingPongState = !pingPongState;
  requestAnimationFrame(simulationLoop);
};

requestAnimationFrame(simulationLoop);

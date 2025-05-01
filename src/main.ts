import "./style.css";
import { initGPU } from "./gpuContext";
import sourceShdr from "./compute_shaders/sources.wgsl";
import diffuseVelShdr from "./compute_shaders/diffuse-velocity.wgsl";
import advectVelShdr from "./compute_shaders/advect-velocity.wgsl";
import vectorBoundsShdr from "./compute_shaders/vector-boundaries.wgsl";
import diffuseDensShdr from "./compute_shaders/diffuse-density.wgsl";
import advectDensShdr from "./compute_shaders/advect-density.wgsl";
import scalarBoundsShdr from "./compute_shaders/scalar-boundaries.wgsl";
import calcDivergenceShdr from "./compute_shaders/calc-divergence.wgsl";
import solvePressureShdr from "./compute_shaders/solve-pressure.wgsl";
import projectVelocityShdr from "./compute_shaders/project-velocity.wgsl";
import vtxOverlayShdr from "./vertex_shaders/vertex-overlay.wgsl";
import renderShdr from "./fragment_shaders/renderer.wgsl";
//@ts-ignore
import Bresenham from "bresenham";

const gridX = 300;
const gridY = 300;

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
canvas.width = gridX;
canvas.height = gridY;
canvas.style.height = "90%";
canvas.style.border = "1px solid green";

const { device, context, canvasFormat } = await initGPU(canvas);

//setup initial state
const gridSize = new Uint32Array([gridX, gridY]);
const vectorsGrid = new Float32Array(gridX * gridY * 2);
const scalarsGrid = new Float32Array(gridX * gridY);
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

const sourceShdrMdl = device.createShaderModule({
  label: "sources shader",
  code: sourceShdr,
});
const diffuseVelShdrMdl = device.createShaderModule({
  label: "diffuse velocity shader",
  code: diffuseVelShdr,
});
const advectVelShdrMdl = device.createShaderModule({
  label: "advect velocity shader",
  code: advectVelShdr,
});
const calcDivergenceShdrMdl = device.createShaderModule({
  label: "calc divergence shader",
  code: calcDivergenceShdr,
});
const solvePressureShdrMdl = device.createShaderModule({
  label: "solve pressure shader",
  code: solvePressureShdr,
});
const projectVelShdrMdl = device.createShaderModule({
  label: "project velocity shader",
  code: projectVelocityShdr,
});
const vecBndsShdrMdl = device.createShaderModule({
  label: "vector boundaries shader",
  code: vectorBoundsShdr,
});
const diffuseDensShdrMdl = device.createShaderModule({
  label: "diffuse density shader",
  code: diffuseDensShdr,
});
const advectDensShdrMdl = device.createShaderModule({
  label: "advect density shader",
  code: advectDensShdr,
});
const scalarBndsShdrMdl = device.createShaderModule({
  label: "density boundaries shader",
  code: scalarBoundsShdr,
});

const sourceBindGroupLayout = device.createBindGroupLayout({
  label: "source bind group layout",
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

const inOutBindGroupLayout = device.createBindGroupLayout({
  label: "velocity bind group layout",
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
        type: "storage",
      },
    },
  ],
});

const inInOutBindGroupLayout = device.createBindGroupLayout({
  label: "velocity bind group layout",
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
  ],
});

const scalarBndsBindGroupLayout = device.createBindGroupLayout({
  label: "scalar boundaries bind group layout",
  entries: [
    {
      // grid_size
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    },
    {
      // scalars
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

const vectorBndsBindGroupLayout = device.createBindGroupLayout({
  label: "vector boundaries bind group layout",
  entries: [
    {
      // grid_size
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    },
    {
      // vectors
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

const divergencesBindGroupLayout = device.createBindGroupLayout({
  label: "divergence bind group layout",
  entries: [
    {
      // grid_size
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    },
    {
      // velocities
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      // divergences
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
    {
      // pressures
      binding: 3,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

const solvePressureBindGroupLayout = device.createBindGroupLayout({
  label: "solve pressure bind group layout",
  entries: [
    {
      //grid_size
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    },
    {
      // divergences
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      // pressures in
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      // pressures out
      binding: 3,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

const projectVelocitiesBindGroupLayout = device.createBindGroupLayout({
  label: "project velocity bind group layout",
  entries: [
    {
      //grid_size
      binding: 0,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "uniform",
      },
    },
    {
      // pressures
      binding: 1,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "read-only-storage",
      },
    },
    {
      // velocities
      binding: 2,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type: "storage",
      },
    },
  ],
});

const renderPipeline = device.createRenderPipeline({
  layout: "auto",
  vertex: {
    module: device.createShaderModule({ code: vtxOverlayShdr }), // from vs_main
    entryPoint: "vs_main",
  },
  fragment: {
    module: device.createShaderModule({ code: renderShdr }), // from your grayscale fragment shader
    entryPoint: "main",
    targets: [
      {
        format: canvasFormat,
      },
    ],
  },
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

const velocityBindGroups = [
  device.createBindGroup({
    label: "bind group A",
    layout: inOutBindGroupLayout,
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
          buffer: velocitiesBuffers[1],
        },
      },
    ],
  }),
  device.createBindGroup({
    label: "bind group B",
    layout: inOutBindGroupLayout,
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
          buffer: velocitiesBuffers[0],
        },
      },
    ],
  }),
];

const setVelocityBndsBindGroups = [
  device.createBindGroup({
    label: "set velocity boundaries bind group A",
    layout: vectorBndsBindGroupLayout,
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
    ],
  }),
  device.createBindGroup({
    label: "set velocity boundaries bind group B",
    layout: vectorBndsBindGroupLayout,
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
    ],
  }),
];

const setDensityBndsBindGroups = [
  device.createBindGroup({
    label: "set density boundaries bind group A",
    layout: scalarBndsBindGroupLayout,
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
          buffer: densitiesBuffers[0],
        },
      },
    ],
  }),
  device.createBindGroup({
    label: "set velocity boundaries bind group B",
    layout: vectorBndsBindGroupLayout,
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
          buffer: densitiesBuffers[1],
        },
      },
    ],
  }),
];

const setPressureBndsBindGroups = [
  device.createBindGroup({
    label: "set density boundaries bind group A",
    layout: scalarBndsBindGroupLayout,
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
          buffer: pressuresBuffers[0],
        },
      },
    ],
  }),
  device.createBindGroup({
    label: "set velocity boundaries bind group B",
    layout: vectorBndsBindGroupLayout,
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
          buffer: pressuresBuffers[1],
        },
      },
    ],
  }),
];

const setDivergenceBndsBindGroup = device.createBindGroup({
  label: "set divergence boundaries bind group",
  layout: scalarBndsBindGroupLayout,
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
        buffer: divergenceBuffer,
      },
    },
  ],
});

const diffuseDensitiesBindGroup = device.createBindGroup({
  label: "diffuse density bind group",
  layout: inOutBindGroupLayout,
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
        buffer: densitiesBuffers[0],
      },
    },
    {
      binding: 2,
      resource: {
        buffer: densitiesBuffers[1],
      },
    },
  ],
});

const advectDensitiesBindGroup = device.createBindGroup({
  label: "advect density bind group",
  layout: inInOutBindGroupLayout,
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
        buffer: densitiesBuffers[1],
      },
    },
    {
      binding: 3,
      resource: {
        buffer: densitiesBuffers[0],
      },
    },
  ],
});

const divergencesBindGroups = [
  device.createBindGroup({
    label: "divergences bind group A",
    layout: divergencesBindGroupLayout,
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
          buffer: divergenceBuffer,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: pressuresBuffers[0],
        },
      },
    ],
  }),
  device.createBindGroup({
    label: "divergences bind group B",
    layout: divergencesBindGroupLayout,
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
          buffer: divergenceBuffer,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: pressuresBuffers[0],
        },
      },
    ],
  }),
];

const solvePressureBindGroups = [
  device.createBindGroup({
    label: "solve pressures bind group A",
    layout: solvePressureBindGroupLayout,
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
          buffer: divergenceBuffer,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: pressuresBuffers[0],
        },
      },
      {
        binding: 3,
        resource: {
          buffer: pressuresBuffers[1],
        },
      },
    ],
  }),
  device.createBindGroup({
    label: "solve pressures bind group B",
    layout: solvePressureBindGroupLayout,
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
          buffer: divergenceBuffer,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: pressuresBuffers[1],
        },
      },
      {
        binding: 3,
        resource: {
          buffer: pressuresBuffers[0],
        },
      },
    ],
  }),
];

const projectVelocitiesBindGroups = [
  device.createBindGroup({
    label: "project velocities bind group A",
    layout: projectVelocitiesBindGroupLayout,
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
          buffer: pressuresBuffers[0],
        },
      },
      {
        binding: 2,
        resource: {
          buffer: velocitiesBuffers[0],
        },
      },
    ],
  }),
  device.createBindGroup({
    label: "project velocities bind group A",
    layout: projectVelocitiesBindGroupLayout,
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
          buffer: pressuresBuffers[0],
        },
      },
      {
        binding: 2,
        resource: {
          buffer: velocitiesBuffers[1],
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
    module: sourceShdrMdl,
    entryPoint: "computeMain",
  },
});

const diffuseVelocityPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [inOutBindGroupLayout],
  }),
  compute: {
    module: diffuseVelShdrMdl,
    entryPoint: "computeMain",
  },
});
const advectVelocityPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [inOutBindGroupLayout],
  }),
  compute: {
    module: advectVelShdrMdl,
    entryPoint: "computeMain",
  },
});
const divergencesPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [divergencesBindGroupLayout],
  }),
  compute: {
    module: calcDivergenceShdrMdl,
    entryPoint: "computeMain",
  },
});
const solvePressuresPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [solvePressureBindGroupLayout],
  }),
  compute: {
    module: solvePressureShdrMdl,
    entryPoint: "computeMain",
  },
});
const projectVelocitiesPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [projectVelocitiesBindGroupLayout],
  }),
  compute: {
    module: projectVelShdrMdl,
    entryPoint: "computeMain",
  },
});
const diffuseDensityPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [inOutBindGroupLayout],
  }),
  compute: {
    module: diffuseDensShdrMdl,
    entryPoint: "computeMain",
  },
});
const advectDensityPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [inInOutBindGroupLayout],
  }),
  compute: {
    module: advectDensShdrMdl,
    entryPoint: "computeMain",
  },
});
const vectorBoundaryPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [vectorBndsBindGroupLayout],
  }),
  compute: {
    module: vecBndsShdrMdl,
    entryPoint: "computeMain",
  },
});
const scalarBoundaryPipeline = device.createComputePipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [scalarBndsBindGroupLayout],
  }),
  compute: {
    module: scalarBndsShdrMdl,
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

const projectVelocities = (encoder: GPUCommandEncoder) => {
  let pass = encoder.beginComputePass();
  pass.setPipeline(divergencesPipeline);
  pass.setBindGroup(0, divergencesBindGroups[1]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(scalarBoundaryPipeline);
  pass.setBindGroup(0, setDivergenceBndsBindGroup);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(scalarBoundaryPipeline);
  pass.setBindGroup(0, setPressureBndsBindGroups[0]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  for (let i = 0; i < 10; i++) {
    pass = encoder.beginComputePass();
    pass.setPipeline(solvePressuresPipeline);
    pass.setBindGroup(0, solvePressureBindGroups[0]);
    pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
    pass.end();

    pass = encoder.beginComputePass();
    pass.setPipeline(scalarBoundaryPipeline);
    pass.setBindGroup(0, setPressureBndsBindGroups[1]);
    pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
    pass.end();

    pass = encoder.beginComputePass();
    pass.setPipeline(solvePressuresPipeline);
    pass.setBindGroup(0, solvePressureBindGroups[1]);
    pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
    pass.end();

    pass = encoder.beginComputePass();
    pass.setPipeline(scalarBoundaryPipeline);
    pass.setBindGroup(0, setPressureBndsBindGroups[0]);
    pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
    pass.end();
  }
  pass = encoder.beginComputePass();
  pass.setPipeline(projectVelocitiesPipeline);
  pass.setBindGroup(0, projectVelocitiesBindGroups[1]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(vectorBoundaryPipeline);
  pass.setBindGroup(0, setVelocityBndsBindGroups[1]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();
};

const simulationLoop = () => {
  const encoder = device.createCommandEncoder();
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
    const sourcePass = encoder.beginComputePass();
    sourcePass.setPipeline(sourcePipeline);
    sourcePass.setBindGroup(0, sourceBindGroup);
    sourcePass.dispatchWorkgroups(Math.ceil(cells.length / 256));
    sourcePass.end();
  }
  let pass = encoder.beginComputePass();
  pass.setPipeline(diffuseVelocityPipeline);
  pass.setBindGroup(0, velocityBindGroups[0]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(vectorBoundaryPipeline);
  pass.setBindGroup(0, setVelocityBndsBindGroups[1]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  projectVelocities(encoder);

  pass = encoder.beginComputePass();
  pass.setPipeline(advectVelocityPipeline);
  pass.setBindGroup(0, velocityBindGroups[1]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(vectorBoundaryPipeline);
  pass.setBindGroup(0, setVelocityBndsBindGroups[0]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  projectVelocities(encoder);

  pass = encoder.beginComputePass();
  pass.setPipeline(diffuseDensityPipeline);
  pass.setBindGroup(0, diffuseDensitiesBindGroup);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(scalarBoundaryPipeline);
  pass.setBindGroup(0, setDensityBndsBindGroups[1]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(advectDensityPipeline);
  pass.setBindGroup(0, advectDensitiesBindGroup);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
  pass.end();

  pass = encoder.beginComputePass();
  pass.setPipeline(scalarBoundaryPipeline);
  pass.setBindGroup(0, setDensityBndsBindGroups[0]);
  pass.dispatchWorkgroups(Math.ceil(gridX / 16), Math.ceil(gridY / 16));
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

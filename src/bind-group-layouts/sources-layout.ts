export const createSourcesBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "sources bind group layout",
    entries: [
      {
        // number of source cells
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform",
        },
      },
      {
        // sources list in struct form. See sources.wgsl for details.
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
    ],
  });
};

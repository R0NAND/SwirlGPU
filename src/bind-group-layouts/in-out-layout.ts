export const createInOutBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "in-out bind group layout",
    entries: [
      {
        //grid_size
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {},
      },
      {
        // field data in
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // field data out
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};

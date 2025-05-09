export const createInOutBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "in-out bind group layout",
    entries: [
      {
        // field data in
        binding: 0,
        visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // field data out
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};

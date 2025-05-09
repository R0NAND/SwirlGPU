export const createScalarBoundsBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "scalar bounds bind group layout",
    entries: [
      {
        // scalars
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};

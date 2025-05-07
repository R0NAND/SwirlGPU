export const createSimParamsBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "sim params bind group layout",
    entries: [
      {
        //grid_size
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {},
      },
      {
        //dt
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {},
      },
      {
        //viscosity
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {},
      },
      {
        //diffusivity
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {},
      },
    ],
  });
};

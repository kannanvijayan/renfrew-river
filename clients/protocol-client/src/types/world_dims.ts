
type WorldDims = {
  columns: number,
  rows: number,
};

type WorldDimsInput = {
  columns: string,
  rows: string,
};

type WorldDimsValidation = {
  errors: string[],
  columns: string[],
  rows: string[],
};

const WorldDimsValidation = {
  isValid(validation: WorldDimsValidation): boolean {
    return validation.errors.length === 0 &&
      validation.columns.length === 0 &&
      validation.rows.length === 0;
  },
}

export default WorldDims;
export { WorldDimsInput, WorldDimsValidation };


export default function assert(condition: boolean, message?: string)
  : asserts condition
{
  if (!condition) {
    const error = new Error(message);
    console.error("Assertion failed", error);
    throw error;
  }
}
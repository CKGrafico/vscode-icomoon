export const numbers = {
    intToHex(int: number): string {
        return int.toString(16);
    },
    hexToInt(hex: string): number {
        return parseInt(hex, 16);
    },
};
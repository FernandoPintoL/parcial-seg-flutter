// services/ColorUtils.ts
export class ColorUtils {
    /**
     * Converts any color format to HEX
     * @param color The color to convert
     * @returns The color in HEX format
     */
    static toHex(color: string): string {
        // If already a valid hex color, return it
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
            return color.toUpperCase();
        }

        // Try to parse as RGB
        const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        }

        // Try to parse as HSL
        const hslMatch = color.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/i);
        if (hslMatch) {
            const h = parseInt(hslMatch[1]) / 360;
            const s = parseInt(hslMatch[2]) / 100;
            const l = parseInt(hslMatch[3]) / 100;

            // Convert HSL to RGB
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p: number, q: number, t: number) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };

                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }

            // Convert RGB to HEX
            const toHex = (x: number) => {
                const hex = Math.round(x * 255).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };

            return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
        }

        // Default to black if invalid color
        return '#000000';
    }

    /**
     * Converts HEX to RGB
     * @param color The color to convert
     * @returns The color in RGB format
     */
    static toRgb(color: string): string {
        // Ensure we have a valid hex color
        const hex = this.toHex(color);

        // Parse the hex color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Converts HEX to HSL
     * @param color The color to convert
     * @returns The color in HSL format
     */
    static toHsl(color: string): string {
        // Ensure we have a valid hex color
        const hex = this.toHex(color);

        // Parse the hex color
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        // Convert to degrees, percentage, percentage
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);

        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    /**
     * Converts a color name to a hex color
     * @param colorName The name of the color
     * @returns The color in HEX format
     */
    static colorNameToHex(colorName: string): string {
        const colorMap: Record<string, string> = {
            red: 'FF0000',
            blue: '0000FF',
            green: '00FF00',
            yellow: 'FFFF00',
            black: '000000',
            white: 'FFFFFF',
            grey: '808080',
            purple: '800080',
            orange: 'FFA500',
            pink: 'FFC0CB',
            brown: 'A52A2A',
            cyan: '00FFFF',
            teal: '008080',
            indigo: '4B0082',
            amber: 'FFBF00',
            lime: '00FF00'
        };

        return colorMap[colorName.toLowerCase()] || '000000';
    }
}

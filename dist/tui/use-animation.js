"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnimation = useAnimation;
const react_1 = require("react");
function useAnimation(frameCount, intervalMs = 500) {
    const [frame, setFrame] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        if (frameCount <= 1)
            return;
        const timer = setInterval(() => {
            setFrame((prev) => (prev + 1) % frameCount);
        }, intervalMs);
        return () => clearInterval(timer);
    }, [frameCount, intervalMs]);
    return frame;
}
//# sourceMappingURL=use-animation.js.map
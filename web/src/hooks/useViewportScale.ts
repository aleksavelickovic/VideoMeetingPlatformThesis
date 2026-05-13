import {useLayoutEffect, useRef, useState} from 'react';

export function useViewportScale() {
    const viewportRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [contentSize, setContentSize] = useState({width: 0, height: 0});

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        const content = contentRef.current;

        if (!viewport || !content) {
            return;
        }

        let frame = 0;

        const updateScale = () => {
            cancelAnimationFrame(frame);

            frame = requestAnimationFrame(() => {
                const viewportWidth = viewport.clientWidth;
                const viewportHeight = viewport.clientHeight;
                const contentWidth = content.offsetWidth;
                const contentHeight = content.offsetHeight;

                if (!viewportWidth || !viewportHeight || !contentWidth || !contentHeight) {
                    setContentSize({width: contentWidth, height: contentHeight});
                    setScale(1);
                    return;
                }

                setContentSize(currentSize => (
                    currentSize.width === contentWidth && currentSize.height === contentHeight
                        ? currentSize
                        : {width: contentWidth, height: contentHeight}
                ));

                const nextScale = Math.min(
                    viewportWidth / contentWidth,
                    viewportHeight / contentHeight,
                    1
                );

                setScale(currentScale => (
                    Math.abs(currentScale - nextScale) < 0.01 ? currentScale : nextScale
                ));
            });
        };

        updateScale();

        const resizeObserver = new ResizeObserver(updateScale);
        resizeObserver.observe(viewport);
        resizeObserver.observe(content);

        window.addEventListener('resize', updateScale);
        window.visualViewport?.addEventListener('resize', updateScale);

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateScale);
            window.visualViewport?.removeEventListener('resize', updateScale);
        };
    }, []);

    return {
        viewportRef,
        contentRef,
        scale,
        contentWidth: contentSize.width,
        contentHeight: contentSize.height,
        scaledWidth: contentSize.width ? contentSize.width * scale : 0,
        scaledHeight: contentSize.height ? contentSize.height * scale : 0,
    };
}

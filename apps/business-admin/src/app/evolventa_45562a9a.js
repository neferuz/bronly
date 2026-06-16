import cssModule from "@vercel/turbopack-next/internal/font/local/cssmodule.module.css?{%22path%22:%22layout.tsx%22,%22import%22:%22%22,%22arguments%22:[{%22src%22:[{%22path%22:%22../../public/fonts/Evolventa-Regular.ttf%22,%22weight%22:%22400%22,%22style%22:%22normal%22},{%22path%22:%22../../public/fonts/Evolventa-Bold.ttf%22,%22weight%22:%22700%22,%22style%22:%22normal%22}],%22variable%22:%22--font-evolventa%22}],%22variableName%22:%22evolventa%22}";
const fontData = {
    className: cssModule.className,
    style: {
        fontFamily: "'evolventa', 'evolventa Fallback'",
        
    },
};

if (cssModule.variable != null) {
    fontData.variable = cssModule.variable;
}

export default fontData;

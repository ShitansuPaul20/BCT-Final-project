import React, { useEffect, useRef, useState, useId } from 'react'
import mermaid from 'mermaid'
import { Download } from 'lucide-react'

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
        background: '#141414',
        primaryColor: '#1c1c1c',
        primaryTextColor: '#e5e5e5',
        primaryBorderColor: '#3a3a3a',
        lineColor: '#666',
        fontSize: '13px',
    },
})

const MermaidDiagram = ({ code }) => {
    const containerRef = useRef(null)
    const [error, setError] = useState(null)
    const [svgContent, setSvgContent] = useState(null)
    const uniqueId = useId().replace(/:/g, '')

    useEffect(() => {
        if (!code) return
        let cancelled = false
        setError(null)

        mermaid.parse(code)
            .then(() => mermaid.render(`mermaid-${uniqueId}`, code))
            .then(({ svg }) => {
                if (!cancelled && containerRef.current) {
                    containerRef.current.innerHTML = svg
                    setSvgContent(svg)
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Mermaid render error:', err)
                    setError('Diagram could not be rendered.')
                }
            })

        return () => { cancelled = true }
    }, [code, uniqueId])

    const handleDownload = () => {
        if (!svgContent) return
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'diagram.svg'
        a.click()
        URL.revokeObjectURL(url)
    }

    if (!code) return null

    return (
        <div className="mt-3 bg-[#1c1c1c] border border-white/10 rounded-xl p-4 overflow-x-auto relative group">
            {error ? (
                <p className="text-white/40 text-xs">{error}</p>
            ) : (
                <>
                    <div ref={containerRef} className="flex justify-center" />
                    {svgContent && (
                        <button
                            onClick={handleDownload}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20
                                       text-white/50 hover:text-white/90 transition-colors opacity-0 group-hover:opacity-100"
                            title="Download diagram"
                        >
                            <Download size={14} />
                        </button>
                    )}
                </>
            )}
        </div>
    )
}

export default MermaidDiagram
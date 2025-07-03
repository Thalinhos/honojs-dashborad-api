export default function Home(pessoas: String[]) {
    return (
        <>  
            <h1>testeeeee from home html-jsx bponeee</h1>
            <div>
                <script src="//unpkg.com/alpinejs" defer></script>
                {pessoas.map((p) => {
                    return (
                        <>
                            <p>Nome: {p}</p>
                            <button className={p}> Disparar </button>
                        </>
                    )
                })}
            <hr />
            </div>
        </>
    )
}
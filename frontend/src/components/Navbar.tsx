import logo from '../assets/favicon.svg'
interface Props {
    name: string;
    button: string;
}

function NavBar({ name, button }: Props) {
    return (
        <>
            <nav className="navbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={logo}
                        alt="Digest Logo"
                        style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'contain'
                        }}
                    />
                    <h1 className="navbar-heading">{name}</h1>
                </div>
            </nav>
        </>
    )
}

export default NavBar;

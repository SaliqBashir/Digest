import logo from "../assets/favicon.svg";
import Button from "./Button";
interface Props {
  name: string;
  button: string;
}
function NavBar({ name, button }: Props) {
  return (
    <>
      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img
            src={logo}
            alt="Digest Logo"
            style={{
              width: "50px",
              height: "50px",
              objectFit: "contain",
            }}
          />
          <h1 className="navbar-heading">{name}</h1>
        </div>
        <Button onClick={() => console.log("test")}>{button}</Button>
      </nav>
    </>
  );
}

export default NavBar;

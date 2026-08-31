import logo from "../assets/favicon.svg";
import Button from "./Button";
interface Props {
  name: string;
  button: string;
  onButtonClick: () => void;
}
function NavBar({ name, button, onButtonClick}: Props) {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <img
            src={logo}
            alt="Digest Logo"
            className="navbar-logo"
          />
          <h1 className="navbar-heading">{name}</h1>
        </div>
        <Button onClick={onButtonClick}>{button}</Button>
      </nav>
    </>
  );
}

export default NavBar;

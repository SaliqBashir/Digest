import logo from "../assets/favicon.svg";
import profileLogo from "../assets/profile.svg";
import Button from "./Button";
interface Props {
  name: string;
  button: string;
  onButtonClick: () => void;
  showProfile?: boolean;
  onProfileClick?: () => void;
}
function NavBar({ name, button, onButtonClick, showProfile, onProfileClick}: Props) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button onClick={onButtonClick}>{button}</Button>
          {showProfile && (
            <img 
              src={profileLogo} 
              alt="Profile" 
              onClick={onProfileClick}
              style={{ width: '24px', height: '24px', cursor: 'pointer' }}
            />
          )}
        </div>
      </nav>
    </>
  );
}

export default NavBar;

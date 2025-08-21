import { useSelector } from "react-redux";
import { isAdmin } from "../../users/selectors";
import { FormattedMessage } from "react-intl";

const CreateJournalistButton = ({ openDialog }) => {
  const admin = useSelector(isAdmin);

  if (!admin) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation(); // evita que se cierre el dropdown por click "fuera"
    openDialog();        // abre el modal
  };

  return (
    <a
      className="dropdown-item"
      onClick={handleClick}
      href="#"
      style={{
        backgroundColor: '#00000F',
        borderColor: '#00000F',
        color: '#ffffff'
      }}
    >
      <FormattedMessage id="project.users.CreateJournalist.title" defaultMessage="Register Journalist" />
    </a>
  );
};

export default CreateJournalistButton;

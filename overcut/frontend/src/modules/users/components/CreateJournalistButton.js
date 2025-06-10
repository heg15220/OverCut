import { useState } from "react";
import CreateJournalistDialog from "./CreateJournalistDialog";
import { useSelector } from "react-redux";
import { isAdmin } from "../../users/selectors";
import { FormattedMessage } from "react-intl";

const CreateJournalistButton = () => {
  const [open, setOpen] = useState(false);
  const admin = useSelector(isAdmin);

  if (!admin) return null;

  return (
    <>
      <a
        className="dropdown-item"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        href="#"
        style={{ backgroundColor: '#00000F', borderColor: '#00000F', color: '#ffffff' }}
      >
        <FormattedMessage id="project.users.CreateJournalist.title" defaultMessage="Register Journalist" />
      </a>
      <CreateJournalistDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default CreateJournalistButton;

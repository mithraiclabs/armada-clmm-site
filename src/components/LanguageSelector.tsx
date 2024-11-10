import { Menu, Transition } from "@headlessui/react";
import { ReactComponent as LanguageIcon } from "../assets/icons/language.svg";
import { Fragment } from "react";
import i18next from "i18next";
import { TextButton } from "./Button/TextButton";
import { useTranslation } from "react-i18next";

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  return (
    <Menu as="div" className="relative inline-block">
      <Menu.Button className="hover:opacity-75 active:opacity-50 pr-0">
        <div className="h-8 w-8 border-[1px] border-primary rounded-lg flex items-center justify-center text-primary">
          <LanguageIcon width={20} />
        </div>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute -right-[200%] md:right-0 z-30 bg-background rounded-lg ">
          <Menu.Items
            as="div"
            className="bg-background-panel min-w-[200px] p-3 rounded-lg space-y-2"
          >
            <div className="pb-2">
              <Menu.Item as="div" className="py-1">
                <TextButton
                  className={
                    i18n.language === "en"
                      ? "font-bold"
                      : "text-text-placeholder"
                  }
                  onClick={() => i18next.changeLanguage("en")}
                >
                  English
                </TextButton>
              </Menu.Item>
              {/* EXAMPLE how to add a new language to LanguageSelector */}
              {/* <Menu.Item as="div" className="py-1">
                <TextButton
                  className={
                    i18n.language === "es"
                      ? "font-bold"
                      : " text-text-placeholder"
                  }
                  onClick={() => i18next.changeLanguage("es")}
                >
                  Spanish
                </TextButton>
              </Menu.Item> */}
            </div>
          </Menu.Items>
        </div>
      </Transition>
    </Menu>
  );
};

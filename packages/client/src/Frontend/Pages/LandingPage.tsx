import { PLAYER_GUIDE, VERSION } from "@df/constants";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { Link, Spacer, Title } from "../Components/CoreUI";
import { Modal } from "../Components/Modal";
import { Pink } from "../Components/Text";
import dfstyles from "../Styles/dfstyles";
import { WORLD_NAME } from "@df/constants";

export const enum LandingPageZIndex {
  Background = 0,
  Canvas = 1,
  BasePage = 2,
}

const DFArchonLinks = {
  twitter: "https://twitter.com/darkforest_punk",
  email: "mailto:dfarchon@gmail.com",
  blog: "https://mirror.xyz/dfarchon.eth",
  discord: "https://discord.com/invite/XpBPEnsvgX",
  github: "https://github.com/dfarchon",
  wiki: "https://dfwiki.net/wiki/Main_Page",
  plugins: "https://dfares-plugins.netlify.app/",
  guide: PLAYER_GUIDE,
};

export function LandingPageRoundArt() {
  const navigate = useNavigate();
  // const defaultAddress = address(CONTRACT_ADDRESS);

  return (
    <Container>
      <ImgContainer>
        <LandingPageRoundArtImg
          src={"/favicon.ico"}
          onClick={() => navigate(`/play`)}
        />
      </ImgContainer>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const ImgContainer = styled.div`
  display: inline-block;
  text-align: right;
  width: 150px; //750px;
  max-width: 80vw;

  background-color: #ffb4c1;

  img:hover {
    transform: scale(1.8);
  }

  @media only screen and (max-device-width: 1000px) {
    width: 100%;
    max-width: 100%;
    padding: 8px;
    font-size: 80%;
  }
`;

const LandingPageRoundArtImg = styled.img`
  cursor: pointer;
  transition: all 0.3s;
`;

export const ClassicLandingPage = () => {
  return (
    <>
      {/* <PrettyOverlayGradient /> */}
      <Fundraising />

      <Page>
        <OnlyMobile>
          <Spacer height={8} />
        </OnlyMobile>
        <HideOnMobile>
          <Spacer height={100} />
        </HideOnMobile>

        <MainContentContainer>
          <Header>
            <OnlyMobile>
              <Spacer height={4} />
            </OnlyMobile>
            <HideOnMobile>
              <Spacer height={12} />
            </HideOnMobile>

            {/* <Spacer height={6} /> */}

            <PreTitle>
              <LinkContainer>
                <a
                  className={"link"}
                  href={DFArchonLinks.guide}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <span style={{ fontSize: "50px" }}>
                      <Round3Title>{WORLD_NAME}</Round3Title>
                    </span>
                    <br />
                    <span style={{ fontSize: "30px" }}>
                      <Round3Title> {VERSION}</Round3Title>
                    </span>
                  </div>

                  <div style={{ fontSize: "40px" }}></div>
                </a>
              </LinkContainer>
            </PreTitle>

            <LandingPageRoundArt />
            <SubTitle>
              <div style={{ fontSize: "30px", color: "pink" }}>
                <Round3Title>
                  Community-driven development of Dark Forest on MUD
                </Round3Title>
              </div>

              {/* <div style={{ fontSize: '30px', color: '#05fe1a' }}>
                <Round3Title> Dark Forest Community Round</Round3Title>
              </div> */}

              {/* <div style={{ fontSize: '30px', color: 'red' }}>
                <Round3Title> Redstone Mainnet</Round3Title>
              </div> */}

              <Spacer height={48} />

              <LinkContainer>
                <a
                  className={"link"}
                  href={DFArchonLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                >
                  Twitter
                </a>
                <Spacer width={6} />
                <a
                  className={"link"}
                  href={DFArchonLinks.discord}
                  target="_blank"
                  rel="noreferrer"
                >
                  Discord
                </a>
                <Spacer width={6} />
                <a
                  className={"link"}
                  href={DFArchonLinks.guide}
                  target="_blank"
                  rel="noreferrer"
                >
                  Guide
                </a>
              </LinkContainer>
            </SubTitle>
          </Header>

          <Spacer height={32} />
        </MainContentContainer>
      </Page>
    </>
  );
};

const Round3Title = styled.span`
  font-family: "Start Press 2P", sans-serif;
`;

const PreTitle = styled.div`
  width: 1000px;
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const SubTitle = styled.div`
  width: 1000px;
  position: absolute;
  top: 80%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

// @ts-expect-error unused
const PrettyOverlayGradient = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
      to left top,
      rgba(74, 74, 74, 0.628),
      rgba(60, 1, 255, 0.2)
    )
    fixed;
  background-position: 50%, 50%;
  display: inline-block;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
`;

const Header = styled.div`
  text-align: center;
`;

// @ts-expect-error unused
const EmailWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

// @ts-expect-error unused
const TRow = styled.tr`
  & td:first-child {
    color: ${dfstyles.colors.subtext};
  }
  & td:nth-child(2) {
    padding-left: 12pt;
  }
  & td:nth-child(3) {
    text-align: right;
    padding-left: 16pt;
  }
`;

const MainContentContainer = styled.div`
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`;

const Page = styled.div`
  position: absolute;
  width: 100vw;
  max-width: 100vw;
  height: 100%;
  color: white;
  /* background-color: #ffb4c1; */
  background-color: "black";
  font-size: ${dfstyles.fontSize};
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: ${LandingPageZIndex.BasePage};
  background-image: url("/background.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* background-position: 1%; */
`;

// @ts-expect-error unused
const HallOfFameTitle = styled.div`
  color: ${dfstyles.colors.subtext};
  display: inline-block;
  border-bottom: 1px solid ${dfstyles.colors.subtext};
  line-height: 1em;
`;

export const LinkContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  /* margin-top: 130pt; */
  font-family: 'Start Press 2P', sans-serif;

  a {
    margin: 0 6pt;
    transition: color 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    color:  ${"#ffc3cd"};
    font-family: 'Start Press 2P', sans-serif;

    &:hover {
      cursor: pointer;
      &.link-twitter {
        color: ${dfstyles.colors.icons.twitter};
      }
      &.link-github {
        color: ${dfstyles.colors.icons.github};
      }
      &.link-discord {
        color: ${dfstyles.colors.icons.discord};
      }
      &.link-blog {
        color: ${dfstyles.colors.icons.blog};
      }
      &.link-email {
        color: ${dfstyles.colors.icons.email};
      }
      &.link{
        /* color: ${dfstyles.colors.dfpink}; */
        color:${"white"}
        /* font-weight: bolder; */

      }
      }
    }
  }
`;

function Fundraising() {
  return (
    <HideOnMobile>
      <Modal contain={["top", "left", "right"]} initialX={50} initialY={50}>
        <Title slot="title">How to Support DFArchon team</Title>
        <div style={{ maxWidth: "300px" }}>
          As a community team, we need to raise funds to support our future
          development plans. <Pink>Donations are welcome.</Pink>
          <br />
          {/* <br />
          In return, we offer:
          <br />
          <Pink>Onchain Gaming Insights:</Pink> Expertise in fully onchain games
          and consulting services.
          <br />
          <Pink>Custom Dark Forest Services:</Pink> Fast development of
          customized Dark Forest versions.
          <br /> */}
          <br />
          Interested in supporting us? Contact{" "}
          <Link to="https://t.me/cherryblue1024">cherryblue1024</Link>.
          We&apos;ll respond ASAP.
        </div>
      </Modal>
    </HideOnMobile>
  );
}

const HideOnMobile = styled.div`
  @media only screen and (max-device-width: 1000px) {
    display: none;
  }
`;

const OnlyMobile = styled.div`
  @media only screen and (min-device-width: 1000px) {
    display: none;
  }
`;

// @ts-expect-error unused
const Involved = styled.div`
  width: 100%;
  padding-left: 16px;
  padding-right: 16px;
  display: grid;
  grid-template-columns: auto auto;
  gap: 10px;
  grid-auto-rows: minmax(100px, auto);

  @media only screen and (max-device-width: 1000px) {
    grid-template-columns: auto;
  }
`;

// @ts-expect-error unused
const InvolvedItem = styled.a`
  height: 150px;
  display: inline-block;
  margin: 4px;
  padding: 4px 8px;

  background-color: ${dfstyles.colors.backgroundlighter};
  background-size: cover;
  background-position: 50% 50%;
  background-repeat: no-repeat;

  cursor: pointer;
  transition: transform 200ms;
  &:hover {
    transform: scale(1.03);
  }
  &:hover:active {
    transform: scale(1.05);
  }
`;

// @ts-expect-error unused
const HallOfFame = styled.div`
  @media only screen and (max-device-width: 1000px) {
    font-size: 70%;
  }
`;

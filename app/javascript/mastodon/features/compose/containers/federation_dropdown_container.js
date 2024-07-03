import { connect } from 'react-redux';

import { changeComposeFederation } from '../../../actions/compose';
import { openModal, closeModal } from '../../../actions/modal';
import { isUserTouching } from '../../../is_mobile';
import FederationDropdown from '../components/federation_dropdown';

const mapStateToProps = state => ({
  value: state.getIn(['compose', 'federation']),
});

const mapDispatchToProps = dispatch => ({

  onChange (value) {
    dispatch(changeComposeFederation(value));
  },

  isUserTouching,
  onModalOpen: props => dispatch(openModal({
    modalType: 'ACTIONS',
    modalProps: props,
  })),
  onModalClose: () => dispatch(closeModal({
    modalType: undefined,
    ignoreFocus: false,
  })),
});

export default connect(mapStateToProps, mapDispatchToProps)(FederationDropdown);

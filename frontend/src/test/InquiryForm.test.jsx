import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import InquiryForm from '../components/InquiryForm.jsx';
it('shows validation errors and does not submit an empty inquiry',()=>{
 const save=vi.fn();render(<InquiryForm onSave={save}/>);
 fireEvent.click(screen.getByRole('button',{name:'Save inquiry'}));
 expect(screen.getByText('Enter at least 2 characters.')).toBeInTheDocument();
 expect(screen.getByText('Enter at least 10 characters.')).toBeInTheDocument();
 expect(save).not.toHaveBeenCalled();
});
